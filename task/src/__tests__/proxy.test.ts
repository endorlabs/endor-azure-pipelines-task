import {
  describeProxy,
  isBypassedByNoProxy,
  resolveProxy,
  createProxyAgent,
} from "../proxy";
import { expect, test, describe, beforeEach, afterEach, jest } from "@jest/globals";
import * as tl from "azure-pipelines-task-lib/task";

const TARGET = "https://api.endorlabs.com/meta/version";

/**
 * Agent variables and proxy environment variables are both process global, so
 * each test starts from a clean slate.
 */
const PROXY_ENV_VARS = [
  "HTTPS_PROXY",
  "https_proxy",
  "HTTP_PROXY",
  "http_proxy",
  "NO_PROXY",
  "no_proxy",
];

let agentVariables: Record<string, string | undefined> = {};
let originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  agentVariables = {};
  originalEnv = {};
  for (const name of PROXY_ENV_VARS) {
    originalEnv[name] = process.env[name];
    delete process.env[name];
  }

  jest
    .spyOn(tl, "getVariable")
    .mockImplementation((name: string) => agentVariables[name]);
});

afterEach(() => {
  jest.restoreAllMocks();
  for (const name of PROXY_ENV_VARS) {
    if (originalEnv[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = originalEnv[name];
    }
  }
});

describe("resolveProxy", () => {
  test("returns undefined when no proxy is configured", () => {
    expect(resolveProxy(TARGET)).toBeUndefined();
  });

  test("reads HTTPS_PROXY", () => {
    process.env.HTTPS_PROXY = "http://proxy.corp.local:8080";

    expect(resolveProxy(TARGET)).toEqual({
      url: "http://proxy.corp.local:8080",
      username: undefined,
      password: undefined,
      source: "the HTTPS_PROXY environment variable",
    });
  });

  test("prefers HTTPS_PROXY over HTTP_PROXY", () => {
    process.env.HTTP_PROXY = "http://http-proxy.corp.local:8080";
    process.env.HTTPS_PROXY = "http://https-proxy.corp.local:8080";

    expect(resolveProxy(TARGET)?.url).toEqual(
      "http://https-proxy.corp.local:8080"
    );
  });

  test("falls back to HTTP_PROXY when HTTPS_PROXY is unset", () => {
    process.env.HTTP_PROXY = "http://http-proxy.corp.local:8080";

    expect(resolveProxy(TARGET)?.url).toEqual(
      "http://http-proxy.corp.local:8080"
    );
  });

  test("accepts the lowercase spelling", () => {
    process.env.https_proxy = "http://proxy.corp.local:8080";

    expect(resolveProxy(TARGET)?.source).toEqual(
      "the https_proxy environment variable"
    );
  });

  test("ignores a variable that is set but empty", () => {
    process.env.HTTPS_PROXY = "   ";

    expect(resolveProxy(TARGET)).toBeUndefined();
  });

  test("extracts basic credentials from the proxy URL", () => {
    process.env.HTTPS_PROXY = "http://svc-endor:s3cret@proxy.corp.local:8080";

    expect(resolveProxy(TARGET)).toMatchObject({
      url: "http://proxy.corp.local:8080",
      username: "svc-endor",
      password: "s3cret",
    });
  });

  test("percent-decodes credentials so reserved characters survive", () => {
    process.env.HTTPS_PROXY =
      "http://domain%5Cuser:p%40ss%3Aword@proxy.corp.local:8080";

    expect(resolveProxy(TARGET)).toMatchObject({
      username: "domain\\user",
      password: "p@ss:word",
    });
  });

  test("tolerates a bare % in the credentials", () => {
    process.env.HTTPS_PROXY = "http://svc:pa%ss@proxy.corp.local:8080";

    expect(resolveProxy(TARGET)).toMatchObject({
      username: "svc",
      password: "pa%ss",
    });
  });

  test("defaults a scheme-less proxy to http", () => {
    process.env.HTTPS_PROXY = "proxy.corp.local:8080";

    expect(resolveProxy(TARGET)?.url).toEqual("http://proxy.corp.local:8080");
  });

  test("supports an https proxy endpoint", () => {
    process.env.HTTPS_PROXY = "https://proxy.corp.local:8443";

    expect(resolveProxy(TARGET)?.url).toEqual("https://proxy.corp.local:8443");
  });

  test("drops a trailing path from the proxy URL", () => {
    process.env.HTTPS_PROXY = "http://proxy.corp.local:8080/";

    expect(resolveProxy(TARGET)?.url).toEqual("http://proxy.corp.local:8080");
  });

  test("honours NO_PROXY", () => {
    process.env.HTTPS_PROXY = "http://proxy.corp.local:8080";
    process.env.NO_PROXY = "api.endorlabs.com";

    expect(resolveProxy(TARGET)).toBeUndefined();
  });

  test("throws a redacted error for an unsupported proxy protocol", () => {
    process.env.HTTPS_PROXY = "socks5://svc:s3cret@proxy.corp.local:1080";

    expect(() => resolveProxy(TARGET)).toThrow(/unsupported protocol/);
    expect(() => resolveProxy(TARGET)).not.toThrow(/s3cret/);
  });

  describe("agent proxy configuration", () => {
    test("takes precedence over the environment", () => {
      process.env.HTTPS_PROXY = "http://env-proxy.corp.local:8080";
      agentVariables["Agent.ProxyUrl"] = "http://agent-proxy.corp.local:8080";

      jest.spyOn(tl, "getHttpProxyConfiguration").mockReturnValue({
        proxyUrl: "http://agent-proxy.corp.local:8080",
        proxyFormattedUrl: "http://agent-proxy.corp.local:8080",
      });

      expect(resolveProxy(TARGET)).toMatchObject({
        url: "http://agent-proxy.corp.local:8080",
        source: "the agent proxy configuration (Agent.ProxyUrl)",
      });
    });

    test("uses the separately stored agent credentials", () => {
      agentVariables["Agent.ProxyUrl"] = "http://agent-proxy.corp.local:8080";

      jest.spyOn(tl, "getHttpProxyConfiguration").mockReturnValue({
        proxyUrl: "http://agent-proxy.corp.local:8080",
        proxyFormattedUrl: "http://svc:s3cret@agent-proxy.corp.local:8080",
        proxyUsername: "svc",
        proxyPassword: "s3cret",
      });

      expect(resolveProxy(TARGET)).toMatchObject({
        username: "svc",
        password: "s3cret",
      });
    });

    test("does not fall through to the environment when the URL is bypassed", () => {
      process.env.HTTPS_PROXY = "http://env-proxy.corp.local:8080";
      agentVariables["Agent.ProxyUrl"] = "http://agent-proxy.corp.local:8080";

      // getHttpProxyConfiguration returns null when the target matches
      // Agent.ProxyBypassList.
      jest.spyOn(tl, "getHttpProxyConfiguration").mockReturnValue(null);

      expect(resolveProxy(TARGET)).toBeUndefined();
    });
  });
});

describe("isBypassedByNoProxy", () => {
  test.each<[noProxy: string, expected: boolean]>([
    ["", false],
    ["*", true],
    ["api.endorlabs.com", true],
    ["API.ENDORLABS.COM", true],
    ["endorlabs.com", true],
    [".endorlabs.com", true],
    ["other.com, api.endorlabs.com", true],
    ["  api.endorlabs.com  ", true],
    ["api.endorlabs.com:443", true],
    ["api.endorlabs.com:8080", false],
    ["dorlabs.com", false],
    ["notendorlabs.com", false],
    ["api.endorlabs.com.evil.com", false],
    // Corporate provisioning tools commonly emit the wildcard form.
    ["*.endorlabs.com", true],
    ["*.corp.local", false],
  ])("NO_PROXY=%j bypasses api.endorlabs.com: %s", (noProxy, expected) => {
    expect(isBypassedByNoProxy(TARGET, noProxy)).toEqual(expected);
  });

  test.each<[noProxy: string, expected: boolean]>([
    ["::1", true],
    ["[::1]", true],
    ["fe80::1", false],
  ])("NO_PROXY=%j bypasses an IPv6 target: %s", (noProxy, expected) => {
    expect(isBypassedByNoProxy("https://[::1]:8443/meta", noProxy)).toEqual(
      expected
    );
  });
});

describe("describeProxy", () => {
  test("leaves a credential-free proxy untouched", () => {
    expect(
      describeProxy({
        url: "http://proxy.corp.local:8080",
        source: "test",
      })
    ).toEqual("http://proxy.corp.local:8080");
  });

  test("masks the password", () => {
    const rendered = describeProxy({
      url: "http://proxy.corp.local:8080",
      username: "svc",
      password: "s3cret",
      source: "test",
    });

    expect(rendered).toEqual("http://svc:***@proxy.corp.local:8080");
    expect(rendered).not.toContain("s3cret");
  });
});

describe("createProxyAgent", () => {
  test("returns undefined when no proxy is configured", () => {
    expect(createProxyAgent(TARGET)).toBeUndefined();
  });

  test("builds an agent pointed at the proxy endpoint", () => {
    process.env.HTTPS_PROXY = "http://proxy.corp.local:8080";

    const agent = createProxyAgent(TARGET) as any;

    expect(agent).toBeDefined();
    expect(agent.proxy).toMatchObject({
      host: "proxy.corp.local",
      port: 8080,
    });
  });

  test("defaults to port 80 for an http proxy with no port", () => {
    process.env.HTTPS_PROXY = "http://proxy.corp.local";

    expect((createProxyAgent(TARGET) as any).proxy.port).toEqual(80);
  });

  test("defaults to port 443 for an https proxy with no port", () => {
    process.env.HTTPS_PROXY = "https://proxy.corp.local";

    expect((createProxyAgent(TARGET) as any).proxy.port).toEqual(443);
  });

  test("never logs the proxy password", () => {
    process.env.HTTPS_PROXY = "http://svc:s3cret@proxy.corp.local:8080";
    const logged: string[] = [];
    jest
      .spyOn(console, "info")
      .mockImplementation((...args: unknown[]) => logged.push(args.join(" ")));

    createProxyAgent(TARGET);

    expect(logged.join("\n")).toContain("http://svc:***@proxy.corp.local:8080");
    expect(logged.join("\n")).not.toContain("s3cret");
  });
});
