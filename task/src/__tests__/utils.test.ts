import {
  getPlatformInfo,
  getEndorctlChecksum,
  describeHttpFailure,
  describeRequestFailure,
} from "../utils";
import { expect, test, describe } from "@jest/globals";
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

describe("describeHttpFailure", () => {
  const url = "https://api.endorlabs.com/meta/version";

  test("explains a proxy authentication challenge", () => {
    const message = describeHttpFailure(407, url);

    expect(message).toContain("407");
    expect(message).toContain("proxy requires authentication");
    // NTLM proxies are a known dead end; say so rather than let the user retry.
    expect(message).toContain("NTLM");
  });

  test("falls back to a plain summary", () => {
    const message = describeHttpFailure(404, url);

    expect(message).toContain("404");
    expect(message).toContain(url);
    expect(message).not.toContain("proxy");
  });
});

describe("describeRequestFailure", () => {
  const url = "https://api.endorlabs.com/meta/version";

  const tlsError = (code: string): NodeJS.ErrnoException =>
    Object.assign(new Error("unable to verify the first certificate"), { code });

  test.each([
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "SELF_SIGNED_CERT_IN_CHAIN",
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  ])("points a %s failure at the CA bundle", (code) => {
    const message = describeRequestFailure(tlsError(code), url, "Request to");

    expect(message).toContain("TLS-intercepting proxy");
    expect(message).toContain("NODE_EXTRA_CA_CERTS");
  });

  test("leaves an unrelated failure alone", () => {
    const error = Object.assign(new Error("socket hang up"), {
      code: "ECONNRESET",
    });
    const message = describeRequestFailure(error, url, "Request to");

    expect(message).toEqual(`Request to ${url} failed: socket hang up`);
  });

  test("uses the supplied description of the operation", () => {
    const error = Object.assign(new Error("boom"), { code: "ECONNRESET" });

    expect(
      describeRequestFailure(error, url, "Download of endorctl binary from")
    ).toEqual(`Download of endorctl binary from ${url} failed: boom`);
  });
});
