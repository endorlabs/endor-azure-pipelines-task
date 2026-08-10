import type { Agent } from "http";
import * as tl from "azure-pipelines-task-lib/task";
import createHttpsProxyAgent from "https-proxy-agent";

/** Credentials are kept out of `url` so it is always safe to log. */
export interface ResolvedProxy {
  /** Proxy endpoint without credentials, e.g. `http://proxy.corp.local:8080`. */
  url: string;
  username?: string;
  password?: string;
  /** Human readable origin of the setting, used for logging. */
  source: string;
}

// Every URL we fetch is https, but build images often set only HTTP_PROXY and
// expect it to cover everything.
const PROXY_ENV_VARS = [
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
];

const NO_PROXY_ENV_VARS = ["NO_PROXY", "no_proxy"];

/**
 * Resolves the proxy to use for a request to `targetUrl`, or `undefined` when
 * the request should be made directly.
 */
export function resolveProxy(targetUrl: string): ResolvedProxy | undefined {
  // The agent's own config wins; it is what Azure Pipelines documents. Read
  // Agent.ProxyUrl directly because getHttpProxyConfiguration returns null both
  // when unconfigured and when bypassed, and only the former should fall through.
  const agentProxyUrl = tl.getVariable("Agent.ProxyUrl");
  if (agentProxyUrl) {
    const config = tl.getHttpProxyConfiguration(targetUrl);
    if (!config) {
      return undefined;
    }

    const source = "the agent proxy configuration (Agent.ProxyUrl)";
    const endpoint = normalizeProxyUrl(config.proxyUrl, source);

    return {
      url: endpoint.url,
      // Stored unencoded, so preferred over anything embedded in the URL.
      username: config.proxyUsername ?? endpoint.username,
      password: config.proxyUsername
        ? config.proxyPassword
        : endpoint.password,
      source,
    };
  }

  const fromEnv = firstEnvValue(PROXY_ENV_VARS);
  if (!fromEnv) {
    return undefined;
  }

  const noProxy = firstEnvValue(NO_PROXY_ENV_VARS);
  if (noProxy && isBypassedByNoProxy(targetUrl, noProxy.value)) {
    return undefined;
  }

  const source = `the ${fromEnv.name} environment variable`;
  const endpoint = normalizeProxyUrl(fromEnv.value, source);

  return { ...endpoint, source };
}

/**
 * Builds an agent that tunnels through the configured proxy, or undefined when
 * no proxy applies. Pass straight to the `agent` request option.
 */
export function createProxyAgent(targetUrl: string): Agent | undefined {
  const proxy = resolveProxy(targetUrl);
  if (!proxy) {
    return undefined;
  }

  console.info(
    `Using proxy ${describeProxy(proxy)} for ${targetUrl} (configured via ${
      proxy.source
    })`
  );

  const parsed = new URL(proxy.url);
  const secureProxy = parsed.protocol === "https:";

  return createHttpsProxyAgent({
    protocol: parsed.protocol,
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : secureProxy ? 443 : 80,
    // Sent as `Proxy-Authorization: Basic`. NTLM/Kerberos are not supported.
    ...(proxy.username
      ? { auth: `${proxy.username}:${proxy.password ?? ""}` }
      : {}),
  });
}

/** Renders a proxy for logging, with the password masked. */
export function describeProxy(proxy: ResolvedProxy): string {
  if (!proxy.username) {
    return proxy.url;
  }

  const parsed = new URL(proxy.url);
  return `${parsed.protocol}//${proxy.username}:***@${parsed.host}`;
}

/**
 * Evaluates a `NO_PROXY` list. Entries may be a hostname, a `.suffix`, a
 * `host:port` pair, or `*`.
 */
export function isBypassedByNoProxy(
  targetUrl: string,
  noProxy: string
): boolean {
  let target: URL;
  try {
    target = new URL(targetUrl);
  } catch {
    return false;
  }

  const hostname = target.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const port = target.port
    ? Number(target.port)
    : target.protocol === "http:"
      ? 80
      : 443;

  return noProxy
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0)
    .some((entry) => matchesNoProxyEntry(entry, hostname, port));
}

function matchesNoProxyEntry(
  entry: string,
  hostname: string,
  port: number
): boolean {
  if (entry === "*") {
    return true;
  }

  let host = entry;

  const separator = entry.lastIndexOf(":");
  if (separator > -1 && /^\d+$/.test(entry.slice(separator + 1))) {
    const withoutPort = entry.slice(0, separator);
    // An unbracketed IPv6 literal is all colons; the tail is not a port.
    const isBareIpv6 =
      withoutPort.includes(":") && !withoutPort.startsWith("[");
    if (!isBareIpv6) {
      if (Number(entry.slice(separator + 1)) !== port) {
        return false;
      }
      host = withoutPort;
    }
  }

  // `*.corp.local`, `.corp.local` and `corp.local` all mean the domain and its
  // subdomains. Brackets are dropped so `::1` matches a `[::1]` hostname.
  host = host.replace(/^\*?\.*/, "").replace(/^\[|\]$/g, "");
  if (!host) {
    return false;
  }

  return hostname === host || hostname.endsWith(`.${host}`);
}

/**
 * Splits a proxy setting into an endpoint and its credentials. Errors never
 * quote the value, which may embed a password.
 */
function normalizeProxyUrl(
  raw: string,
  source: string
): { url: string; username?: string; password?: string } {
  const trimmed = raw.trim();

  // Like curl, treat a scheme-less `host:port` as http.
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withScheme);
  } catch {
    throw new Error(
      `The proxy configured via ${source} is not a valid URL. Expected http://[user:password@]host:port`
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `The proxy configured via ${source} uses the unsupported protocol \`${parsed.protocol}\`. Only http and https proxies are supported.`
    );
  }

  if (!parsed.hostname) {
    throw new Error(
      `The proxy configured via ${source} does not specify a host. Expected http://[user:password@]host:port`
    );
  }

  return {
    // `host` keeps the port; a proxy has no path.
    url: `${parsed.protocol}//${parsed.host}`,
    username: parsed.username ? decodeCredential(parsed.username) : undefined,
    password: parsed.password ? decodeCredential(parsed.password) : undefined,
  };
}

/** A bare `%` in a password is a typo we can live with, not a fatal error. */
function decodeCredential(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function firstEnvValue(
  names: string[]
): { name: string; value: string } | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) {
      return { name, value };
    }
  }

  return undefined;
}
