import * as https from "https";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as tl from "azure-pipelines-task-lib/task";

import { ClientChecksumsType, SetupProps, VersionResponse } from "./types";
import { arch } from "os";

export type BinaryFileInfo = {
  filename: string;
  downloadUrl: string;
};

/**
 * Create a hash from a file
 */
export const createHashFromFile = (filePath: string) =>
  new Promise((resolve) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
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
      osSuffixes[platform] === "macos" && architecture.startsWith("arm")
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
    console.info("failed to download endorctl.");
    console.info(error);
  }

  return "";
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

  const downloadEndorctlFunc = (urlString: string, filename: string) =>
    new Promise<void>((resolve, reject) => {
      const fileWriter = fs.createWriteStream(filePath, {
        mode: 0o766,
      });
      const url = new URL(urlString);
      const requestOpts: https.RequestOptions = {
        host: url.hostname,
        path: url.pathname,
        timeout: 300000,
      };

      https
        .get(requestOpts, (res) => {
          res.on("error", (err) => {
            console.error(`endorctl binary download failed: ${err.message}`);
            reject(err);
          });

          const respError = res.statusCode !== 200;
          if (respError) {
            fileWriter.close();
          }

          fileWriter.on("close", () => {
            console.log(`${filename} saved to ${filePath}`);
            if (respError) {
              reject(new Error(`${res.statusCode}`));
            } else {
              resolve();
            }
          });

          res.pipe(fileWriter);
        })
        .on("timeout", () => {
          console.error(`Download of ${filename} timed out`);
          reject();
        })
        .on("error", (err) => {
          console.error(
            `Download request for endorctl binary ${filename} failed: ${err.message}`
          );
          reject(err);
        });
    });

  try {
    console.log(
      `Downloading endorctl: ${fileInfo.filename} from url: ${fileInfo.downloadUrl}`
    );
    await downloadEndorctlFunc(fileInfo.downloadUrl, fileInfo.filename);
    console.log(`Successfully downloaded ${fileInfo.filename} file.`);
    return;
  } catch (err: any) {
    console.error(`Failed to download ${fileInfo.filename}: ${err.message}`);
  }
}

/**
 * Make an HTTPS request and return the response body
 */
async function makeHttpsCall(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data: string = "";

        // Handle incoming data chunks
        res.on("data", (chunk) => {
          data += chunk;
        });

        // The whole response has been received
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            console.log("Response Data:", parsedData);
            resolve(data);
          } catch (error) {
            reject(`Error parsing response: ${error}`);
          }
        });
      })
      .on("error", (error) => {
        reject(`HTTPS request failed: ${error}`);
      });
  });
}
