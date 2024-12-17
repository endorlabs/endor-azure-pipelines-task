import * as https from "https";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as tl from "azure-pipelines-task-lib/task";

import { ClientChecksumsType, SetupProps, VersionResponse } from "./types";
import { arch } from "os";

export type Executable = {
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

export const commandExists = (command: string) => {
  try {
    const platform = getPlatformInfo(tl.getPlatform(), arch());
    const cmd =
      platform.os === "windows" ? `where ${command}` : `which ${command}`;

    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
};

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
      throw new Error("Agent.TempDirectory is not set"); // set by Azure Pipelines environment
    }

    await downloadExecutable(endorctlDir, {
      filename: binaryName,
      downloadUrl: url,
    });

    const hash = await createHashFromFile(path.join(endorctlDir, binaryName));
    if (hash !== endorctlChecksum) {
      throw new Error(
        "The checksum of the downloaded binary does not match the expected value!"
      );
    } else {
      console.info(`Binary checksum: ${endorctlChecksum}`);
    }

    console.info(`Endorctl downloaded at ${endorctlDir}`);
    return `${endorctlDir}${path.sep}endorctl${isWindows ? ".exe" : ""}`;
  } catch (error: any) {
    console.log("failed to download endorctl.");
    console.log(error);
  }

  return "";
};

/**
 * Downloads the executable from the given URL to the target directory
 */
export async function downloadExecutable(
  targetDirectory: string,
  executable: Executable,
  maxRetries = 3
) {
  const filePath = path.join(targetDirectory, executable.filename);
  console.log(`Downloading executable to: ${filePath}`);

  // Check if the file already exists
  if (fs.existsSync(filePath)) {
    console.log(
      `File ${executable.filename} already exists, skipping download.`
    );
    return;
  }

  const fileWriter = fs.createWriteStream(filePath, {
    mode: 0o766,
  });

  // Wrapping the download in a function for easy retrying
  const doDownload = (urlString: string, filename: string) =>
    new Promise<void>((resolve, reject) => {
      const url = new URL(urlString);
      const requestOpts: https.RequestOptions = {
        host: url.hostname,
        path: url.pathname,
        timeout: 300000, // 5mins
      };
      https
        .get(requestOpts, (response) => {
          const isResponseError = response.statusCode !== 200;

          response.on("finish", () => {
            console.log(`Response finished for ${urlString}`);
          });
          response.on("close", () => {
            console.log(`Download connection closed for ${urlString}`);
          });
          response.on("error", (err) => {
            console.error(`Download of ${filename} failed: ${err.message}`);
            reject(err);
          });

          if (response.statusCode !== 200) {
            fileWriter.close();
          }

          fileWriter.on("close", () => {
            console.log(`File.close ${filename} saved to ${filePath}`);
            if (isResponseError) {
              reject(new Error(`HTTP ${response.statusCode}`));
            } else {
              resolve();
            }
          });

          response.pipe(fileWriter);
        })
        .on("timeout", () => {
          console.error(`Download of ${filename} timed out`);
          reject();
        })
        .on("error", (err) => {
          console.error(`Request for ${filename} failed: ${err.message}`);
          reject(err);
        });
    });

  // Try to download the file, retry up to `maxRetries` times if the attempt fails
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(
        `Downloading: ${executable.filename} from: ${executable.downloadUrl}`
      );
      await doDownload(executable.downloadUrl, executable.filename);
      console.log(`Download successful for ${executable.filename}`);
      return;
    } catch (err: any) {
      console.error(
        `Download of ${executable.filename} failed: ${err.message}`
      );

      // Don't wait before retrying the last attempt
      if (attempt < maxRetries - 1) {
        console.log(
          `Retrying download of ${executable.filename} from ${executable.downloadUrl} after 5 seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error(
          `All retries failed for ${executable.filename} from ${executable.downloadUrl}: ${err.message}`
        );
      }
    }
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
