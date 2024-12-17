import { getPlatformInfo, getEndorctlChecksum } from "../utils";
import { expect, test } from "@jest/globals";
import * as tl from "azure-pipelines-task-lib/task";
import type { ClientChecksumsType } from "../types";

describe("getPlatformInfo", () => {
  it("should return the correct platform info for Windows x64", () => {
    const arch = "x64";
    const expectedPlatform = {
      os: "windows",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.Windows, arch);
    expect(result).toEqual(expectedPlatform);
  });

  it("should return the correct platform info for Windows arm64", () => {
    const arch = "arm64";
    const expectedPlatform = {
      os: "windows",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.Windows, arch);
    expect(result).toEqual(expectedPlatform);
  });

  it("should return the correct platform info for Linux x64", () => {
    const arch = "x64";
    const expectedPlatform = {
      os: "linux",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.Linux, arch);
    expect(result).toEqual(expectedPlatform);
  });

  it("should return the correct platform info for MacOS x64", () => {
    const arch = "x64";
    const expectedPlatform = {
      os: "macos",
      arch: "amd64",
    };

    const result = getPlatformInfo(tl.Platform.MacOS, arch);
    expect(result).toEqual(expectedPlatform);
  });

  it("should return the correct platform info for MacOS arm64", () => {
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
    { get: (_, property) => property },
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
