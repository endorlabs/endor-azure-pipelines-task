import * as https from "https";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as tl from "azure-pipelines-task-lib/task";

import { ClientChecksumsType, SetupProps, VersionResponse } from "./types";
import { arch } from "os";
import { createProxyAgent } from "./proxy";

export type BinaryFileInfo = {
  filename: string;
  downloadUrl: string;
};

const DOWNLOAD_TIMEOUT_MS = 300000;
const API_TIMEOUT_MS = 30000;

/** Some corporate proxies reject requests that carry no User-Agent. */
const USER_AGENT = "endorctl-azure-pipelines-task";

/**
 * Create a hash from a file
 */
export const createHashFromFile = (filePath: string) =>
  new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
      .on("error", reject)
      .on("data", (data) => hash.update(data))
      .on("end", () => resolve(hash.digest("hex")));
  });

/**
 * Returns the OS and Architecture to be used for downloading endorctl binary,
 * based on the current host OS and Architecture. Returns the error if host
 * OS/Arch combination is not supported
 */
export const getPlatformInfo = (
  platform: tl.Platform,
  architecture: string
) => {
  const osSuffixes: Record<tl.Platform, string> = {
    [tl.Platform.Linux]: "linux",
    [tl.Platform.Windows]: "windows",
    [tl.Platform.MacOS]: "macos",
  };

  return {
    os: osSuffixes[platform],
    arch:
      (osSuffixes[platform] === "macos" || osSuffixes[platform] === "linux") &&
      architecture.startsWith("arm")
        ? "arm64"
        : "amd64",
  };
};

/**
 * Returns the checksum for the given OS and Architecture
 */
export const getEndorctlChecksum = (
  clientChecksums: ClientChecksumsType,
  os?: string,
  arch?: string
) => {
  const platformString = `${os}_${arch}`;
  switch (platformString) {
    case `linux_amd64`:
      return clientChecksums.ARCH_TYPE_LINUX_AMD64;
    case `linux_arm64`:
      return clientChecksums.ARCH_TYPE_LINUX_ARM64;
    case `macos_amd64`:
      return clientChecksums.ARCH_TYPE_MACOS_AMD64;
    case `macos_arm64`:
      return clientChecksums.ARCH_TYPE_MACOS_ARM64;
    case `windows_amd64`:
      return clientChecksums.ARCH_TYPE_WINDOWS_AMD64;
    default:
      return "";
  }
};

/**
 * Type guard for object/Record
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return "object" === typeof value && null !== value;
};

/**
 * Type guard for VersionResponse
 */
export const isVersionResponse = (value: unknown): value is VersionResponse => {
  return (
    isObject(value) &&
    // expect: `Service` property exists
    "Service" in value &&
    isObject(value.Service) &&
    // expect: `Service` property exists
    "ClientChecksums" in value &&
    isObject(value.ClientChecksums)
  );
};

/**
 * @throws {Error} when api is unreachable or returns invalid response
 */
export const fetchLatestEndorctlVersion = async (api: string | undefined) => {
  const body = await makeHttpsCall(`${api}/meta/version`);

  let data: VersionResponse | undefined;
  try {
    data = JSON.parse(body);
  } catch (error) {
    throw new Error(`Invalid response from Endor Labs API: \`${body}\``);
  }

  if (!isVersionResponse(data)) {
    throw new Error(`Invalid response from Endor Labs API: \`${body}\``);
  }

  if (!data.ClientVersion) {
    data.ClientVersion = data.Service.Version;
  }

  return data;
};

/**
 * Downloads the endorctl binary and returns the path to the downloaded binary
 */
export const setupEndorctl = async ({
  version,
  checksum,
  api,
}: SetupProps): Promise<string> => {
  try {
    const platform = getPlatformInfo(tl.getPlatform(), arch());
    const isWindows = platform.os === "windows";

    console.info(`Host Platform: ${platform.os} ${platform.arch}`);

    let endorctlVersion = version;
    let endorctlChecksum = checksum;
    if (!version) {
      console.info(`Endorctl version not provided, using latest version`);

      const data = await fetchLatestEndorctlVersion(api);
      endorctlVersion = data.ClientVersion;
      endorctlChecksum = getEndorctlChecksum(
        data.ClientChecksums,
        platform.os,
        platform.arch
      );
    }

    console.info(`Downloading endorctl version ${endorctlVersion}`);
    const url = `${api}/download/endorlabs/${endorctlVersion}/binaries/endorctl_${endorctlVersion}_${
      platform.os
    }_${platform.arch}${isWindows ? ".exe" : ""}`;
    const binaryName = `endorctl${isWindows ? ".exe" : ""}`;

    let endorctlDir: string | undefined;
    endorctlDir = tl.getVariable("Agent.TempDirectory");
    if (!endorctlDir) {
      throw new Error("Agent.TempDirectory is not set"); // this is set by Azure Pipelines environment
    }

    await downloadBinary(endorctlDir, {
      filename: binaryName,
      downloadUrl: url,
    });

    const hash = await createHashFromFile(path.join(endorctlDir, binaryName));
    if (hash !== endorctlChecksum) {
      throw new Error(
        "The checksum of the endorctl downloaded binary does not match the expected value!"
      );
    } else {
      console.info(`Binary checksum: ${endorctlChecksum}`);
    }

    console.info(`Endorctl downloaded at ${endorctlDir}`);
    return `${endorctlDir}${path.sep}endorctl${isWindows ? ".exe" : ""}`;
  } catch (error: any) {
    // Returning "" here used to leave the task running an empty command, which
    // hid the real cause.
    throw new Error(`Failed to set up endorctl: ${error.message ?? error}`);
  }
};

/**
 * Downloads the executable from the given URL to the target directory
 */
export async function downloadBinary(
  targetDirectory: string,
  fileInfo: BinaryFileInfo
) {
  const filePath = path.join(targetDirectory, fileInfo.filename);
  console.log(`Downloading endorctl binary to: ${filePath}`);

  // Check if the file already exists
  if (fs.existsSync(filePath)) {
    console.log(
      `endorctl binary ${fileInfo.filename} already exists, skipping download.`
    );
    return;
  }

  console.log(
    `Downloading endorctl: ${fileInfo.filename} from url: ${fileInfo.downloadUrl}`
  );

  // Resolved before the file is created: an unusable proxy setting must not
  // leave a zero byte binary behind for the "already exists" check to reuse.
  const agent = createProxyAgent(fileInfo.downloadUrl);

  await new Promise<void>((resolve, reject) => {
    const fileWriter = fs.createWriteStream(filePath, {
      mode: 0o755,
    });

    let settled = false;
    // Delete the partial file, otherwise the "already exists" check above makes
    // the next run reuse it and fail on the checksum instead of the real error.
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      fileWriter.destroy();
      removeIfExists(filePath);
      reject(error);
    };

    // Attached before the request: opening the stream can fail on its own, and
    // an unhandled stream error would take the whole task down.
    fileWriter.on("error", (err) =>
      fail(new Error(`Failed to write ${filePath}: ${err.message}`))
    );

    // https.get throws synchronously on a malformed URL; route that through
    // fail() so the partial file is cleaned up like any other failure.
    let request: ReturnType<typeof https.get>;
    try {
      request = https.get(
        fileInfo.downloadUrl,
        {
          agent,
          timeout: DOWNLOAD_TIMEOUT_MS,
          headers: { "user-agent": USER_AGENT },
        },
        (res) => {
          res.on("error", (err) =>
            fail(
              new Error(
                describeRequestFailure(
                  err,
                  fileInfo.downloadUrl,
                  `Download of endorctl binary ${fileInfo.filename} from`
                )
              )
            )
          );

          if (res.statusCode !== 200) {
            // Drain the body so the socket can be released.
            res.resume();
            fail(
              new Error(
                describeHttpFailure(res.statusCode, fileInfo.downloadUrl)
              )
            );
            return;
          }

          fileWriter.on("close", () => {
            if (settled) return;
            settled = true;
            console.log(`${fileInfo.filename} saved to ${filePath}`);
            resolve();
          });

          res.pipe(fileWriter);
        }
      );
    } catch (err: any) {
      fail(
        new Error(
          describeRequestFailure(
            err,
            fileInfo.downloadUrl,
            `Download request for endorctl binary ${fileInfo.filename} to`
          )
        )
      );
      return;
    }

    request.on("timeout", () => {
      request.destroy();
      fail(
        new Error(
          `Download of ${fileInfo.filename} timed out after ${DOWNLOAD_TIMEOUT_MS}ms`
        )
      );
    });

    request.on("error", (err) =>
      fail(
        new Error(
          describeRequestFailure(
            err,
            fileInfo.downloadUrl,
            `Download request for endorctl binary ${fileInfo.filename} to`
          )
        )
      )
    );
  });

  console.log(`Successfully downloaded ${fileInfo.filename} file.`);
}

/**
 * Make an HTTPS request and return the response body
 */
async function makeHttpsCall(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        agent: createProxyAgent(url),
        timeout: API_TIMEOUT_MS,
        headers: { "user-agent": USER_AGENT },
      },
      (res) => {
        let data: string = "";

        // Handle incoming data chunks
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("error", (error) =>
          reject(new Error(describeRequestFailure(error, url, "Request to")))
        );

        // The whole response has been received
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(describeHttpFailure(res.statusCode, url)));
            return;
          }

          resolve(data);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy();
      reject(new Error(`Request to ${url} timed out after ${API_TIMEOUT_MS}ms`));
    });

    request.on("error", (error) =>
      reject(new Error(describeRequestFailure(error, url, "Request to")))
    );
  });
}

/** Untrusted certificate chain, usually a TLS-intercepting proxy. */
const TLS_TRUST_ERROR_CODES = new Set([
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "CERT_UNTRUSTED",
]);

/**
 * Describes a failed request, pointing at the CA bundle when the proxy is
 * intercepting TLS.
 */
export function describeRequestFailure(
  error: NodeJS.ErrnoException,
  url: string,
  operation: string
): string {
  const summary = `${operation} ${url} failed: ${error.message}`;

  if (error.code && TLS_TRUST_ERROR_CODES.has(error.code)) {
    return `${summary}. This usually means a TLS-intercepting proxy is presenting a certificate signed by an internal certificate authority. Point NODE_EXTRA_CA_CERTS at that authority's certificate bundle on the agent, or configure the Azure Pipelines agent with --sslcacert.`;
  }

  return summary;
}

/** Describes a non-200 response, naming the proxy for the codes it owns. */
export function describeHttpFailure(
  statusCode: number | undefined,
  url: string
): string {
  const summary = `Request to ${url} failed with HTTP status ${statusCode}`;

  switch (statusCode) {
    case 407:
      return `${summary}. The proxy requires authentication - supply credentials as http://user:password@host:port, or configure the Azure Pipelines agent with --proxyurl. Note that only Basic authentication is supported; NTLM and Kerberos proxies are not.`;
    default:
      return summary;
  }
}

function removeIfExists(filePath: string) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch (error: any) {
    console.warn(
      `Failed to remove incomplete download ${filePath}: ${error.message}`
    );
  }
}
