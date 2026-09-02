import {
  getPlatformInfo,
  getEndorctlChecksum,
  resolveProxyUrl,
  isNoProxy,
} from "../utils";
import {
  expect,
  test,
  describe,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import * as tl from "azure-pipelines-task-lib/task";
import type { ClientChecksumsType } from "../types";

describe("getPlatformInfo", () => {
  test("should return the correct platform info for Windows x64", () => {
    const arch = "x64";
    const expectedPlatform = {
      os: "windows",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.Windows, arch);
    expect(result).toEqual(expectedPlatform);
  });

  test("should return the correct platform info for Windows arm64", () => {
    const arch = "arm64";
    const expectedPlatform = {
      os: "windows",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.Windows, arch);
    expect(result).toEqual(expectedPlatform);
  });

  test("should return the correct platform info for Linux x64", () => {
    const arch = "x64";
    const expectedPlatform = {
      os: "linux",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.Linux, arch);
    expect(result).toEqual(expectedPlatform);
  });

  test("should return the correct platform info for MacOS x64", () => {
    const arch = "x64";
    const expectedPlatform = {
      os: "macos",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.MacOS, arch);
    expect(result).toEqual(expectedPlatform);
  });

  test("should return the correct platform info for MacOS arm64", () => {
    const arch = "arm64";
    const expectedPlatform = {
      os: "macos",
      arch: "arm64",
    };

    const result = getPlatformInfo(tl.Platform.MacOS, arch);
    expect(result).toEqual(expectedPlatform);
  });
});

describe("getEndorctlChecksum", () => {
  const fakeChecksums = new Proxy<ClientChecksumsType>(
    {} as ClientChecksumsType,
    { get: (_, property) => property }
  );

  test.each<[os: string, arch: string, expected: string]>([
    ["linux", "amd64", "ARCH_TYPE_LINUX_AMD64"],
    ["macos", "amd64", "ARCH_TYPE_MACOS_AMD64"],
    ["macos", "arm64", "ARCH_TYPE_MACOS_ARM64"],
    ["windows", "amd64", "ARCH_TYPE_WINDOWS_AMD64"],
  ])("getEndorctlChecksum for %s is %o", (os, arch, expected) => {
    const result = getEndorctlChecksum(fakeChecksums, os as any, arch as any);
    expect(result).toEqual(expected);
  });
});

describe("isNoProxy", () => {
  const PROXY_ENV_KEYS = ["NO_PROXY", "no_proxy"];
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of PROXY_ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of PROXY_ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  test("returns false when NO_PROXY is unset", () => {
    expect(isNoProxy("https://api.endorlabs.com/meta/version")).toBe(false);
  });

  test("matches an exact host", () => {
    process.env.NO_PROXY = "api.endorlabs.com";
    expect(isNoProxy("https://api.endorlabs.com/meta/version")).toBe(true);
  });

  test("matches a domain suffix", () => {
    process.env.NO_PROXY = ".endorlabs.com";
    expect(isNoProxy("https://api.endorlabs.com/meta/version")).toBe(true);
  });

  test("does not match an unrelated host", () => {
    process.env.NO_PROXY = "example.com";
    expect(isNoProxy("https://api.endorlabs.com/meta/version")).toBe(false);
  });

  test("wildcard matches everything", () => {
    process.env.NO_PROXY = "*";
    expect(isNoProxy("https://api.endorlabs.com/meta/version")).toBe(true);
  });
});

describe("resolveProxyUrl", () => {
  const PROXY_ENV_KEYS = [
    "HTTPS_PROXY",
    "https_proxy",
    "HTTP_PROXY",
    "http_proxy",
    "NO_PROXY",
    "no_proxy",
  ];
  const saved: Record<string, string | undefined> = {};
  const target = "https://api.endorlabs.com/meta/version";

  beforeEach(() => {
    for (const key of PROXY_ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
    // Default: no Azure agent proxy configured.
    jest.spyOn(tl, "getHttpProxyConfiguration").mockReturnValue(null);
  });

  afterEach(() => {
    for (const key of PROXY_ENV_KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
    jest.restoreAllMocks();
  });

  test("returns undefined when no proxy is configured", () => {
    expect(resolveProxyUrl(target)).toBeUndefined();
  });

  test("uses HTTPS_PROXY when set", () => {
    process.env.HTTPS_PROXY = "http://dlproxy.business.finl.fortis:8080";
    expect(resolveProxyUrl(target)).toBe(
      "http://dlproxy.business.finl.fortis:8080"
    );
  });

  test("falls back to HTTP_PROXY when HTTPS_PROXY is absent", () => {
    process.env.HTTP_PROXY = "http://proxy.local:3128";
    expect(resolveProxyUrl(target)).toBe("http://proxy.local:3128");
  });

  test("respects NO_PROXY over env proxy", () => {
    process.env.HTTPS_PROXY = "http://proxy.local:8080";
    process.env.NO_PROXY = ".endorlabs.com";
    expect(resolveProxyUrl(target)).toBeUndefined();
  });

  test("prefers the Azure agent proxy over env vars", () => {
    process.env.HTTPS_PROXY = "http://env-proxy.local:8080";
    jest.spyOn(tl, "getHttpProxyConfiguration").mockReturnValue({
      proxyUrl: "http://agent-proxy.local:8080",
      proxyUsername: undefined,
      proxyPassword: undefined,
      proxyBypassHosts: undefined,
    } as any);
    expect(resolveProxyUrl(target)).toBe("http://agent-proxy.local:8080");
  });

  test("embeds agent proxy credentials when provided", () => {
    jest.spyOn(tl, "getHttpProxyConfiguration").mockReturnValue({
      proxyUrl: "http://agent-proxy.local:8080",
      proxyUsername: "user",
      proxyPassword: "p@ss",
      proxyBypassHosts: undefined,
    } as any);
    const result = resolveProxyUrl(target);
    expect(result).toContain("user:");
    expect(result).toContain("@agent-proxy.local:8080");
  });
});
