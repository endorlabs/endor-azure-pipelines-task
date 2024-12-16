"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadExecutable = exports.setupEndorctl = exports.fetchLatestEndorctlVersion = exports.isVersionResponse = exports.isObject = exports.getEndorctlChecksum = exports.getPlatformInfo = exports.commandExists = exports.createHashFromFile = void 0;
const https = __importStar(require("https"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const createHashFromFile = (filePath) => new Promise((resolve) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
        .on("data", (data) => hash.update(data))
        .on("end", () => resolve(hash.digest("hex")));
});
exports.createHashFromFile = createHashFromFile;
const commandExists = (command) => {
    try {
        const platform = (0, exports.getPlatformInfo)();
        const cmd = platform.os === "windows" ? `where ${command}` : `which ${command}`;
        (0, child_process_1.execSync)(cmd, { stdio: "ignore" });
        return true;
    }
    catch (error) {
        return false;
    }
};
exports.commandExists = commandExists;
/**
 * Returns the OS and Architecture to be used for downloading endorctl binary,
 * based on the current runner OS and Architecture. Returns the error if runner
 * OS/Arch combination is not supported
 */
const getPlatformInfo = () => {
    const platform = tl.getPlatform();
    const osSuffixes = {
        [tl.Platform.Linux]: "linux",
        [tl.Platform.Windows]: "windows",
        [tl.Platform.MacOS]: "macos",
    };
    const defaultInfo = {
        os: undefined,
        arch: "amd64",
        error: undefined,
    };
    return {
        ...defaultInfo,
        os: osSuffixes[platform],
    };
};
exports.getPlatformInfo = getPlatformInfo;
/**
 * Returns the checksum for the given OS and Architecture
 */
const getEndorctlChecksum = (clientChecksums, os, arch) => {
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
exports.getEndorctlChecksum = getEndorctlChecksum;
/**
 * Type guard for object/Record
 */
const isObject = (value) => {
    return "object" === typeof value && null !== value;
};
exports.isObject = isObject;
/**
 * Type guard for VersionResponse
 */
const isVersionResponse = (value) => {
    return ((0, exports.isObject)(value) &&
        // expect: `Service` property exists
        "Service" in value &&
        (0, exports.isObject)(value.Service) &&
        // expect: `Service` property exists
        "ClientChecksums" in value &&
        (0, exports.isObject)(value.ClientChecksums));
};
exports.isVersionResponse = isVersionResponse;
/**
 * @throws {Error} when api is unreachable or returns invalid response
 */
const fetchLatestEndorctlVersion = async (api) => {
    const body = await makeHttpsCall(`${api}/meta/version`);
    let data;
    try {
        data = JSON.parse(body);
    }
    catch (error) {
        throw new Error(`Invalid response from Endor Labs API: \`${body}\``);
    }
    if (!(0, exports.isVersionResponse)(data)) {
        throw new Error(`Invalid response from Endor Labs API: \`${body}\``);
    }
    if (!data.ClientVersion) {
        data.ClientVersion = data.Service.Version;
    }
    return data;
};
exports.fetchLatestEndorctlVersion = fetchLatestEndorctlVersion;
const setupEndorctl = async ({ version, checksum, api, }) => {
    try {
        const platform = (0, exports.getPlatformInfo)();
        if (platform.error) {
            throw new Error(platform.error);
        }
        const isWindows = platform.os === "windows";
        let endorctlVersion = version;
        let endorctlChecksum = checksum;
        if (!version) {
            console.info(`Endorctl version not provided, using latest version`);
            const data = await (0, exports.fetchLatestEndorctlVersion)(api);
            endorctlVersion = data.ClientVersion;
            endorctlChecksum = (0, exports.getEndorctlChecksum)(data.ClientChecksums, platform.os, platform.arch);
        }
        console.info(`Downloading endorctl version ${endorctlVersion}`);
        const url = `${api}/download/endorlabs/${endorctlVersion}/binaries/endorctl_${endorctlVersion}_${platform.os}_${platform.arch}${isWindows ? ".exe" : ""}`;
        const binaryName = `endorctl${isWindows ? ".exe" : ""}`;
        let endorctlDir;
        endorctlDir = tl.getVariable("Agent.TempDirectory");
        if (!endorctlDir) {
            throw new Error("Agent.TempDirectory is not set"); // set by Azure Pipelines environment
        }
        await downloadExecutable(endorctlDir, {
            filename: binaryName,
            downloadUrl: url,
        });
        const hash = await (0, exports.createHashFromFile)(path.join(endorctlDir, binaryName));
        if (hash !== endorctlChecksum) {
            throw new Error("The checksum of the downloaded binary does not match the expected value!");
        }
        else {
            console.info(`Binary checksum: ${endorctlChecksum}`);
        }
        console.info(`Endorctl downloaded at ${endorctlDir}`);
        return `${endorctlDir}${path.sep}endorctl${isWindows ? ".exe" : ""}`;
    }
    catch (error) {
        console.log("failed to download endorctl.");
        console.log(error);
    }
    return "";
};
exports.setupEndorctl = setupEndorctl;
async function downloadExecutable(targetDirectory, executable, maxRetries = 3) {
    const filePath = path.join(targetDirectory, executable.filename);
    console.log(`Downloading executable to: ${filePath}`);
    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        console.log(`File ${executable.filename} already exists, skipping download.`);
        return;
    }
    const fileWriter = fs.createWriteStream(filePath, {
        mode: 0o766,
    });
    // Wrapping the download in a function for easy retrying
    const doDownload = (urlString, filename) => new Promise((resolve, reject) => {
        const url = new URL(urlString);
        const requestOpts = {
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
                }
                else {
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
            console.log(`Downloading: ${executable.filename} from: ${executable.downloadUrl}`);
            await doDownload(executable.downloadUrl, executable.filename);
            console.log(`Download successful for ${executable.filename}`);
            return;
        }
        catch (err) {
            console.error(`Download of ${executable.filename} failed: ${err.message}`);
            // Don't wait before retrying the last attempt
            if (attempt < maxRetries - 1) {
                console.log(`Retrying download of ${executable.filename} from ${executable.downloadUrl} after 5 seconds...`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
            else {
                console.error(`All retries failed for ${executable.filename} from ${executable.downloadUrl}: ${err.message}`);
            }
        }
    }
}
exports.downloadExecutable = downloadExecutable;
async function makeHttpsCall(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
            let data = "";
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
                }
                catch (error) {
                    reject(`Error parsing response: ${error}`);
                }
            });
        })
            .on("error", (error) => {
            reject(`HTTPS request failed: ${error}`);
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsK0NBQWlDO0FBQ2pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsaURBQXlDO0FBQ3pDLGtFQUFvRDtBQWM3QyxNQUFNLGtCQUFrQixHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQ3JELElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDdEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6QyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO1NBQzFCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQyxDQUFDLENBQUM7QUFOUSxRQUFBLGtCQUFrQixzQkFNMUI7QUFFRSxNQUFNLGFBQWEsR0FBRyxDQUFDLE9BQWUsRUFBRSxFQUFFO0lBQy9DLElBQUk7UUFDRixNQUFNLFFBQVEsR0FBRyxJQUFBLHVCQUFlLEdBQUUsQ0FBQztRQUNuQyxNQUFNLEdBQUcsR0FDUCxRQUFRLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxPQUFPLEVBQUUsQ0FBQztRQUV0RSxJQUFBLHdCQUFRLEVBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbkMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUMsQ0FBQztBQVhXLFFBQUEsYUFBYSxpQkFXeEI7QUFFRjs7OztHQUlHO0FBQ0ksTUFBTSxlQUFlLEdBQUcsR0FBRyxFQUFFO0lBQ2xDLE1BQU0sUUFBUSxHQUFnQixFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7SUFFL0MsTUFBTSxVQUFVLEdBQWdDO1FBQzlDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPO1FBQzVCLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTO1FBQ2hDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPO0tBQzdCLENBQUM7SUFFRixNQUFNLFdBQVcsR0FBaUI7UUFDaEMsRUFBRSxFQUFFLFNBQVM7UUFDYixJQUFJLEVBQUUsT0FBTztRQUNiLEtBQUssRUFBRSxTQUFTO0tBQ2pCLENBQUM7SUFFRixPQUFPO1FBQ0wsR0FBRyxXQUFXO1FBQ2QsRUFBRSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUM7S0FDekIsQ0FBQztBQUNKLENBQUMsQ0FBQztBQW5CVyxRQUFBLGVBQWUsbUJBbUIxQjtBQUVGOztHQUVHO0FBQ0ksTUFBTSxtQkFBbUIsR0FBRyxDQUNqQyxlQUFvQyxFQUNwQyxFQUFXLEVBQ1gsSUFBYSxFQUNiLEVBQUU7SUFDRixNQUFNLGNBQWMsR0FBRyxHQUFHLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUN2QyxRQUFRLGNBQWMsRUFBRTtRQUN0QixLQUFLLGFBQWE7WUFDaEIsT0FBTyxlQUFlLENBQUMscUJBQXFCLENBQUM7UUFDL0MsS0FBSyxhQUFhO1lBQ2hCLE9BQU8sZUFBZSxDQUFDLHFCQUFxQixDQUFDO1FBQy9DLEtBQUssYUFBYTtZQUNoQixPQUFPLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQztRQUMvQyxLQUFLLGVBQWU7WUFDbEIsT0FBTyxlQUFlLENBQUMsdUJBQXVCLENBQUM7UUFDakQ7WUFDRSxPQUFPLEVBQUUsQ0FBQztLQUNiO0FBQ0gsQ0FBQyxDQUFDO0FBbEJXLFFBQUEsbUJBQW1CLHVCQWtCOUI7QUFFRjs7R0FFRztBQUNJLE1BQU0sUUFBUSxHQUFHLENBQUMsS0FBYyxFQUFvQyxFQUFFO0lBQzNFLE9BQU8sUUFBUSxLQUFLLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLENBQUM7QUFDckQsQ0FBQyxDQUFDO0FBRlcsUUFBQSxRQUFRLFlBRW5CO0FBRUY7O0dBRUc7QUFDSSxNQUFNLGlCQUFpQixHQUFHLENBQUMsS0FBYyxFQUE0QixFQUFFO0lBQzVFLE9BQU8sQ0FDTCxJQUFBLGdCQUFRLEVBQUMsS0FBSyxDQUFDO1FBQ2Ysb0NBQW9DO1FBQ3BDLFNBQVMsSUFBSSxLQUFLO1FBQ2xCLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBQ3ZCLG9DQUFvQztRQUNwQyxpQkFBaUIsSUFBSSxLQUFLO1FBQzFCLElBQUEsZ0JBQVEsRUFBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQ2hDLENBQUM7QUFDSixDQUFDLENBQUM7QUFWVyxRQUFBLGlCQUFpQixxQkFVNUI7QUFFRjs7R0FFRztBQUNJLE1BQU0sMEJBQTBCLEdBQUcsS0FBSyxFQUFFLEdBQXVCLEVBQUUsRUFBRTtJQUMxRSxNQUFNLElBQUksR0FBRyxNQUFNLGFBQWEsQ0FBQyxHQUFHLEdBQUcsZUFBZSxDQUFDLENBQUM7SUFFeEQsSUFBSSxJQUFpQyxDQUFDO0lBQ3RDLElBQUk7UUFDRixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6QjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsTUFBTSxJQUFJLEtBQUssQ0FBQywyQ0FBMkMsSUFBSSxJQUFJLENBQUMsQ0FBQztLQUN0RTtJQUVELElBQUksQ0FBQyxJQUFBLHlCQUFpQixFQUFDLElBQUksQ0FBQyxFQUFFO1FBQzVCLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLElBQUksSUFBSSxDQUFDLENBQUM7S0FDdEU7SUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRTtRQUN2QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0tBQzNDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLENBQUM7QUFuQlcsUUFBQSwwQkFBMEIsOEJBbUJyQztBQUVLLE1BQU0sYUFBYSxHQUFHLEtBQUssRUFBRSxFQUNsQyxPQUFPLEVBQ1AsUUFBUSxFQUNSLEdBQUcsR0FDUSxFQUFtQixFQUFFO0lBQ2hDLElBQUk7UUFDRixNQUFNLFFBQVEsR0FBRyxJQUFBLHVCQUFlLEdBQUUsQ0FBQztRQUNuQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLEVBQUU7WUFDbEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDakM7UUFFRCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQztRQUU1QyxJQUFJLGVBQWUsR0FBRyxPQUFPLENBQUM7UUFDOUIsSUFBSSxnQkFBZ0IsR0FBRyxRQUFRLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMscURBQXFELENBQUMsQ0FBQztZQUVwRSxNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsa0NBQTBCLEVBQUMsR0FBRyxDQUFDLENBQUM7WUFDbkQsZUFBZSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7WUFDckMsZ0JBQWdCLEdBQUcsSUFBQSwyQkFBbUIsRUFDcEMsSUFBSSxDQUFDLGVBQWUsRUFDcEIsUUFBUSxDQUFDLEVBQUUsRUFDWCxRQUFRLENBQUMsSUFBSSxDQUNkLENBQUM7U0FDSDtRQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsZ0NBQWdDLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDaEUsTUFBTSxHQUFHLEdBQUcsR0FBRyxHQUFHLHVCQUF1QixlQUFlLHNCQUFzQixlQUFlLElBQzNGLFFBQVEsQ0FBQyxFQUNYLElBQUksUUFBUSxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDOUMsTUFBTSxVQUFVLEdBQUcsV0FBVyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7UUFFeEQsSUFBSSxXQUErQixDQUFDO1FBQ3BDLFdBQVcsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLHFCQUFxQixDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNoQixNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxxQ0FBcUM7U0FDekY7UUFFRCxNQUFNLGtCQUFrQixDQUFDLFdBQVcsRUFBRTtZQUNwQyxRQUFRLEVBQUUsVUFBVTtZQUNwQixXQUFXLEVBQUUsR0FBRztTQUNqQixDQUFDLENBQUM7UUFFSCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsMEJBQWtCLEVBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLElBQUksS0FBSyxnQkFBZ0IsRUFBRTtZQUM3QixNQUFNLElBQUksS0FBSyxDQUNiLDBFQUEwRSxDQUMzRSxDQUFDO1NBQ0g7YUFBTTtZQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLGdCQUFnQixFQUFFLENBQUMsQ0FBQztTQUN0RDtRQUVELE9BQU8sQ0FBQyxJQUFJLENBQUMsMEJBQTBCLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDdEQsT0FBTyxHQUFHLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxXQUFXLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztLQUN0RTtJQUFDLE9BQU8sS0FBVSxFQUFFO1FBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLENBQUMsQ0FBQztRQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3BCO0lBRUQsT0FBTyxFQUFFLENBQUM7QUFDWixDQUFDLENBQUM7QUE3RFcsUUFBQSxhQUFhLGlCQTZEeEI7QUFFSyxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLGVBQXVCLEVBQ3ZCLFVBQXNCLEVBQ3RCLFVBQVUsR0FBRyxDQUFDO0lBRWQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pFLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFFdEQsbUNBQW1DO0lBQ25DLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMzQixPQUFPLENBQUMsR0FBRyxDQUNULFFBQVEsVUFBVSxDQUFDLFFBQVEscUNBQXFDLENBQ2pFLENBQUM7UUFDRixPQUFPO0tBQ1I7SUFFRCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFO1FBQ2hELElBQUksRUFBRSxLQUFLO0tBQ1osQ0FBQyxDQUFDO0lBRUgsd0RBQXdEO0lBQ3hELE1BQU0sVUFBVSxHQUFHLENBQUMsU0FBaUIsRUFBRSxRQUFnQixFQUFFLEVBQUUsQ0FDekQsSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDcEMsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDL0IsTUFBTSxXQUFXLEdBQXlCO1lBQ3hDLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUTtZQUNsQixJQUFJLEVBQUUsR0FBRyxDQUFDLFFBQVE7WUFDbEIsT0FBTyxFQUFFLE1BQU0sRUFBRSxRQUFRO1NBQzFCLENBQUM7UUFDRixLQUFLO2FBQ0YsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQzdCLE1BQU0sZUFBZSxHQUFHLFFBQVEsQ0FBQyxVQUFVLEtBQUssR0FBRyxDQUFDO1lBRXBELFFBQVEsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtnQkFDekIsT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtnQkFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUM3RCxDQUFDLENBQUMsQ0FBQztZQUNILFFBQVEsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7Z0JBQzNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxRQUFRLFlBQVksR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxRQUFRLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRTtnQkFDL0IsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ3BCO1lBRUQsVUFBVSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO2dCQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWMsUUFBUSxhQUFhLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBQzNELElBQUksZUFBZSxFQUFFO29CQUNuQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsUUFBUSxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO2lCQUNsRDtxQkFBTTtvQkFDTCxPQUFPLEVBQUUsQ0FBQztpQkFDWDtZQUNILENBQUMsQ0FBQyxDQUFDO1lBRUgsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1QixDQUFDLENBQUM7YUFDRCxFQUFFLENBQUMsU0FBUyxFQUFFLEdBQUcsRUFBRTtZQUNsQixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsUUFBUSxZQUFZLENBQUMsQ0FBQztZQUNuRCxNQUFNLEVBQUUsQ0FBQztRQUNYLENBQUMsQ0FBQzthQUNELEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLGVBQWUsUUFBUSxZQUFZLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7SUFFTCxnRkFBZ0Y7SUFDaEYsS0FBSyxJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUUsT0FBTyxHQUFHLFVBQVUsRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUNyRCxJQUFJO1lBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FDVCxnQkFBZ0IsVUFBVSxDQUFDLFFBQVEsVUFBVSxVQUFVLENBQUMsV0FBVyxFQUFFLENBQ3RFLENBQUM7WUFDRixNQUFNLFVBQVUsQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RCxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUM5RCxPQUFPO1NBQ1I7UUFBQyxPQUFPLEdBQVEsRUFBRTtZQUNqQixPQUFPLENBQUMsS0FBSyxDQUNYLGVBQWUsVUFBVSxDQUFDLFFBQVEsWUFBWSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQzVELENBQUM7WUFFRiw4Q0FBOEM7WUFDOUMsSUFBSSxPQUFPLEdBQUcsVUFBVSxHQUFHLENBQUMsRUFBRTtnQkFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FDVCx3QkFBd0IsVUFBVSxDQUFDLFFBQVEsU0FBUyxVQUFVLENBQUMsV0FBVyxxQkFBcUIsQ0FDaEcsQ0FBQztnQkFDRixNQUFNLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDM0Q7aUJBQU07Z0JBQ0wsT0FBTyxDQUFDLEtBQUssQ0FDWCwwQkFBMEIsVUFBVSxDQUFDLFFBQVEsU0FBUyxVQUFVLENBQUMsV0FBVyxLQUFLLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FDL0YsQ0FBQzthQUNIO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFoR0QsZ0RBZ0dDO0FBRUQsS0FBSyxVQUFVLGFBQWEsQ0FBQyxHQUFXO0lBQ3RDLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMsS0FBSzthQUNGLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNoQixJQUFJLElBQUksR0FBVyxFQUFFLENBQUM7WUFFdEIsOEJBQThCO1lBQzlCLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7Z0JBQ3ZCLElBQUksSUFBSSxLQUFLLENBQUM7WUFDaEIsQ0FBQyxDQUFDLENBQUM7WUFFSCx1Q0FBdUM7WUFDdkMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUNqQixJQUFJO29CQUNGLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ3BDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQzFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDZjtnQkFBQyxPQUFPLEtBQUssRUFBRTtvQkFDZCxNQUFNLENBQUMsMkJBQTJCLEtBQUssRUFBRSxDQUFDLENBQUM7aUJBQzVDO1lBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLENBQUM7YUFDRCxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDckIsTUFBTSxDQUFDLHlCQUF5QixLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaHR0cHMgZnJvbSBcImh0dHBzXCI7XG5pbXBvcnQgKiBhcyBjcnlwdG8gZnJvbSBcImNyeXB0b1wiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBleGVjU3luYyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgKiBhcyB0bCBmcm9tIFwiYXp1cmUtcGlwZWxpbmVzLXRhc2stbGliL3Rhc2tcIjtcblxuaW1wb3J0IHtcbiAgQ2xpZW50Q2hlY2tzdW1zVHlwZSxcbiAgUGxhdGZvcm1JbmZvLFxuICBTZXR1cFByb3BzLFxuICBWZXJzaW9uUmVzcG9uc2UsXG59IGZyb20gXCIuL3R5cGVzXCI7XG5cbmV4cG9ydCB0eXBlIEV4ZWN1dGFibGUgPSB7XG4gIGZpbGVuYW1lOiBzdHJpbmc7XG4gIGRvd25sb2FkVXJsOiBzdHJpbmc7XG59O1xuXG5leHBvcnQgY29uc3QgY3JlYXRlSGFzaEZyb21GaWxlID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+XG4gIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgIGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpXG4gICAgICAub24oXCJkYXRhXCIsIChkYXRhKSA9PiBoYXNoLnVwZGF0ZShkYXRhKSlcbiAgICAgIC5vbihcImVuZFwiLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KFwiaGV4XCIpKSk7XG4gIH0pO1xuXG5leHBvcnQgY29uc3QgY29tbWFuZEV4aXN0cyA9IChjb21tYW5kOiBzdHJpbmcpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtSW5mbygpO1xuICAgIGNvbnN0IGNtZCA9XG4gICAgICBwbGF0Zm9ybS5vcyA9PT0gXCJ3aW5kb3dzXCIgPyBgd2hlcmUgJHtjb21tYW5kfWAgOiBgd2hpY2ggJHtjb21tYW5kfWA7XG5cbiAgICBleGVjU3luYyhjbWQsIHsgc3RkaW86IFwiaWdub3JlXCIgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIE9TIGFuZCBBcmNoaXRlY3R1cmUgdG8gYmUgdXNlZCBmb3IgZG93bmxvYWRpbmcgZW5kb3JjdGwgYmluYXJ5LFxuICogYmFzZWQgb24gdGhlIGN1cnJlbnQgcnVubmVyIE9TIGFuZCBBcmNoaXRlY3R1cmUuIFJldHVybnMgdGhlIGVycm9yIGlmIHJ1bm5lclxuICogT1MvQXJjaCBjb21iaW5hdGlvbiBpcyBub3Qgc3VwcG9ydGVkXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRQbGF0Zm9ybUluZm8gPSAoKSA9PiB7XG4gIGNvbnN0IHBsYXRmb3JtOiB0bC5QbGF0Zm9ybSA9IHRsLmdldFBsYXRmb3JtKCk7XG5cbiAgY29uc3Qgb3NTdWZmaXhlczogUmVjb3JkPHRsLlBsYXRmb3JtLCBzdHJpbmc+ID0ge1xuICAgIFt0bC5QbGF0Zm9ybS5MaW51eF06IFwibGludXhcIixcbiAgICBbdGwuUGxhdGZvcm0uV2luZG93c106IFwid2luZG93c1wiLFxuICAgIFt0bC5QbGF0Zm9ybS5NYWNPU106IFwibWFjb3NcIixcbiAgfTtcblxuICBjb25zdCBkZWZhdWx0SW5mbzogUGxhdGZvcm1JbmZvID0ge1xuICAgIG9zOiB1bmRlZmluZWQsXG4gICAgYXJjaDogXCJhbWQ2NFwiLFxuICAgIGVycm9yOiB1bmRlZmluZWQsXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICAuLi5kZWZhdWx0SW5mbyxcbiAgICBvczogb3NTdWZmaXhlc1twbGF0Zm9ybV0sXG4gIH07XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGNoZWNrc3VtIGZvciB0aGUgZ2l2ZW4gT1MgYW5kIEFyY2hpdGVjdHVyZVxuICovXG5leHBvcnQgY29uc3QgZ2V0RW5kb3JjdGxDaGVja3N1bSA9IChcbiAgY2xpZW50Q2hlY2tzdW1zOiBDbGllbnRDaGVja3N1bXNUeXBlLFxuICBvcz86IHN0cmluZyxcbiAgYXJjaD86IHN0cmluZ1xuKSA9PiB7XG4gIGNvbnN0IHBsYXRmb3JtU3RyaW5nID0gYCR7b3N9XyR7YXJjaH1gO1xuICBzd2l0Y2ggKHBsYXRmb3JtU3RyaW5nKSB7XG4gICAgY2FzZSBgbGludXhfYW1kNjRgOlxuICAgICAgcmV0dXJuIGNsaWVudENoZWNrc3Vtcy5BUkNIX1RZUEVfTElOVVhfQU1ENjQ7XG4gICAgY2FzZSBgbWFjb3NfYW1kNjRgOlxuICAgICAgcmV0dXJuIGNsaWVudENoZWNrc3Vtcy5BUkNIX1RZUEVfTUFDT1NfQU1ENjQ7XG4gICAgY2FzZSBgbWFjb3NfYXJtNjRgOlxuICAgICAgcmV0dXJuIGNsaWVudENoZWNrc3Vtcy5BUkNIX1RZUEVfTUFDT1NfQVJNNjQ7XG4gICAgY2FzZSBgd2luZG93c19hbWQ2NGA6XG4gICAgICByZXR1cm4gY2xpZW50Q2hlY2tzdW1zLkFSQ0hfVFlQRV9XSU5ET1dTX0FNRDY0O1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCJcIjtcbiAgfVxufTtcblxuLyoqXG4gKiBUeXBlIGd1YXJkIGZvciBvYmplY3QvUmVjb3JkXG4gKi9cbmV4cG9ydCBjb25zdCBpc09iamVjdCA9ICh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgcmV0dXJuIFwib2JqZWN0XCIgPT09IHR5cGVvZiB2YWx1ZSAmJiBudWxsICE9PSB2YWx1ZTtcbn07XG5cbi8qKlxuICogVHlwZSBndWFyZCBmb3IgVmVyc2lvblJlc3BvbnNlXG4gKi9cbmV4cG9ydCBjb25zdCBpc1ZlcnNpb25SZXNwb25zZSA9ICh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFZlcnNpb25SZXNwb25zZSA9PiB7XG4gIHJldHVybiAoXG4gICAgaXNPYmplY3QodmFsdWUpICYmXG4gICAgLy8gZXhwZWN0OiBgU2VydmljZWAgcHJvcGVydHkgZXhpc3RzXG4gICAgXCJTZXJ2aWNlXCIgaW4gdmFsdWUgJiZcbiAgICBpc09iamVjdCh2YWx1ZS5TZXJ2aWNlKSAmJlxuICAgIC8vIGV4cGVjdDogYFNlcnZpY2VgIHByb3BlcnR5IGV4aXN0c1xuICAgIFwiQ2xpZW50Q2hlY2tzdW1zXCIgaW4gdmFsdWUgJiZcbiAgICBpc09iamVjdCh2YWx1ZS5DbGllbnRDaGVja3N1bXMpXG4gICk7XG59O1xuXG4vKipcbiAqIEB0aHJvd3Mge0Vycm9yfSB3aGVuIGFwaSBpcyB1bnJlYWNoYWJsZSBvciByZXR1cm5zIGludmFsaWQgcmVzcG9uc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGZldGNoTGF0ZXN0RW5kb3JjdGxWZXJzaW9uID0gYXN5bmMgKGFwaTogc3RyaW5nIHwgdW5kZWZpbmVkKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSBhd2FpdCBtYWtlSHR0cHNDYWxsKGAke2FwaX0vbWV0YS92ZXJzaW9uYCk7XG5cbiAgbGV0IGRhdGE6IFZlcnNpb25SZXNwb25zZSB8IHVuZGVmaW5lZDtcbiAgdHJ5IHtcbiAgICBkYXRhID0gSlNPTi5wYXJzZShib2R5KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcmVzcG9uc2UgZnJvbSBFbmRvciBMYWJzIEFQSTogXFxgJHtib2R5fVxcYGApO1xuICB9XG5cbiAgaWYgKCFpc1ZlcnNpb25SZXNwb25zZShkYXRhKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZXNwb25zZSBmcm9tIEVuZG9yIExhYnMgQVBJOiBcXGAke2JvZHl9XFxgYCk7XG4gIH1cblxuICBpZiAoIWRhdGEuQ2xpZW50VmVyc2lvbikge1xuICAgIGRhdGEuQ2xpZW50VmVyc2lvbiA9IGRhdGEuU2VydmljZS5WZXJzaW9uO1xuICB9XG5cbiAgcmV0dXJuIGRhdGE7XG59O1xuXG5leHBvcnQgY29uc3Qgc2V0dXBFbmRvcmN0bCA9IGFzeW5jICh7XG4gIHZlcnNpb24sXG4gIGNoZWNrc3VtLFxuICBhcGksXG59OiBTZXR1cFByb3BzKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtSW5mbygpO1xuICAgIGlmIChwbGF0Zm9ybS5lcnJvcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKHBsYXRmb3JtLmVycm9yKTtcbiAgICB9XG5cbiAgICBjb25zdCBpc1dpbmRvd3MgPSBwbGF0Zm9ybS5vcyA9PT0gXCJ3aW5kb3dzXCI7XG5cbiAgICBsZXQgZW5kb3JjdGxWZXJzaW9uID0gdmVyc2lvbjtcbiAgICBsZXQgZW5kb3JjdGxDaGVja3N1bSA9IGNoZWNrc3VtO1xuICAgIGlmICghdmVyc2lvbikge1xuICAgICAgY29uc29sZS5pbmZvKGBFbmRvcmN0bCB2ZXJzaW9uIG5vdCBwcm92aWRlZCwgdXNpbmcgbGF0ZXN0IHZlcnNpb25gKTtcblxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZldGNoTGF0ZXN0RW5kb3JjdGxWZXJzaW9uKGFwaSk7XG4gICAgICBlbmRvcmN0bFZlcnNpb24gPSBkYXRhLkNsaWVudFZlcnNpb247XG4gICAgICBlbmRvcmN0bENoZWNrc3VtID0gZ2V0RW5kb3JjdGxDaGVja3N1bShcbiAgICAgICAgZGF0YS5DbGllbnRDaGVja3N1bXMsXG4gICAgICAgIHBsYXRmb3JtLm9zLFxuICAgICAgICBwbGF0Zm9ybS5hcmNoXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnNvbGUuaW5mbyhgRG93bmxvYWRpbmcgZW5kb3JjdGwgdmVyc2lvbiAke2VuZG9yY3RsVmVyc2lvbn1gKTtcbiAgICBjb25zdCB1cmwgPSBgJHthcGl9L2Rvd25sb2FkL2VuZG9ybGFicy8ke2VuZG9yY3RsVmVyc2lvbn0vYmluYXJpZXMvZW5kb3JjdGxfJHtlbmRvcmN0bFZlcnNpb259XyR7XG4gICAgICBwbGF0Zm9ybS5vc1xuICAgIH1fJHtwbGF0Zm9ybS5hcmNofSR7aXNXaW5kb3dzID8gXCIuZXhlXCIgOiBcIlwifWA7XG4gICAgY29uc3QgYmluYXJ5TmFtZSA9IGBlbmRvcmN0bCR7aXNXaW5kb3dzID8gXCIuZXhlXCIgOiBcIlwifWA7XG5cbiAgICBsZXQgZW5kb3JjdGxEaXI6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBlbmRvcmN0bERpciA9IHRsLmdldFZhcmlhYmxlKFwiQWdlbnQuVGVtcERpcmVjdG9yeVwiKTtcbiAgICBpZiAoIWVuZG9yY3RsRGlyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBZ2VudC5UZW1wRGlyZWN0b3J5IGlzIG5vdCBzZXRcIik7IC8vIHNldCBieSBBenVyZSBQaXBlbGluZXMgZW52aXJvbm1lbnRcbiAgICB9XG5cbiAgICBhd2FpdCBkb3dubG9hZEV4ZWN1dGFibGUoZW5kb3JjdGxEaXIsIHtcbiAgICAgIGZpbGVuYW1lOiBiaW5hcnlOYW1lLFxuICAgICAgZG93bmxvYWRVcmw6IHVybCxcbiAgICB9KTtcblxuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCBjcmVhdGVIYXNoRnJvbUZpbGUocGF0aC5qb2luKGVuZG9yY3RsRGlyLCBiaW5hcnlOYW1lKSk7XG4gICAgaWYgKGhhc2ggIT09IGVuZG9yY3RsQ2hlY2tzdW0pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJUaGUgY2hlY2tzdW0gb2YgdGhlIGRvd25sb2FkZWQgYmluYXJ5IGRvZXMgbm90IG1hdGNoIHRoZSBleHBlY3RlZCB2YWx1ZSFcIlxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5pbmZvKGBCaW5hcnkgY2hlY2tzdW06ICR7ZW5kb3JjdGxDaGVja3N1bX1gKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYEVuZG9yY3RsIGRvd25sb2FkZWQgYXQgJHtlbmRvcmN0bERpcn1gKTtcbiAgICByZXR1cm4gYCR7ZW5kb3JjdGxEaXJ9JHtwYXRoLnNlcH1lbmRvcmN0bCR7aXNXaW5kb3dzID8gXCIuZXhlXCIgOiBcIlwifWA7XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhcImZhaWxlZCB0byBkb3dubG9hZCBlbmRvcmN0bC5cIik7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICB9XG5cbiAgcmV0dXJuIFwiXCI7XG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRFeGVjdXRhYmxlKFxuICB0YXJnZXREaXJlY3Rvcnk6IHN0cmluZyxcbiAgZXhlY3V0YWJsZTogRXhlY3V0YWJsZSxcbiAgbWF4UmV0cmllcyA9IDNcbikge1xuICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbih0YXJnZXREaXJlY3RvcnksIGV4ZWN1dGFibGUuZmlsZW5hbWUpO1xuICBjb25zb2xlLmxvZyhgRG93bmxvYWRpbmcgZXhlY3V0YWJsZSB0bzogJHtmaWxlUGF0aH1gKTtcblxuICAvLyBDaGVjayBpZiB0aGUgZmlsZSBhbHJlYWR5IGV4aXN0c1xuICBpZiAoZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpIHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBGaWxlICR7ZXhlY3V0YWJsZS5maWxlbmFtZX0gYWxyZWFkeSBleGlzdHMsIHNraXBwaW5nIGRvd25sb2FkLmBcbiAgICApO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGZpbGVXcml0ZXIgPSBmcy5jcmVhdGVXcml0ZVN0cmVhbShmaWxlUGF0aCwge1xuICAgIG1vZGU6IDBvNzY2LFxuICB9KTtcblxuICAvLyBXcmFwcGluZyB0aGUgZG93bmxvYWQgaW4gYSBmdW5jdGlvbiBmb3IgZWFzeSByZXRyeWluZ1xuICBjb25zdCBkb0Rvd25sb2FkID0gKHVybFN0cmluZzogc3RyaW5nLCBmaWxlbmFtZTogc3RyaW5nKSA9PlxuICAgIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwodXJsU3RyaW5nKTtcbiAgICAgIGNvbnN0IHJlcXVlc3RPcHRzOiBodHRwcy5SZXF1ZXN0T3B0aW9ucyA9IHtcbiAgICAgICAgaG9zdDogdXJsLmhvc3RuYW1lLFxuICAgICAgICBwYXRoOiB1cmwucGF0aG5hbWUsXG4gICAgICAgIHRpbWVvdXQ6IDMwMDAwMCwgLy8gNW1pbnNcbiAgICAgIH07XG4gICAgICBodHRwc1xuICAgICAgICAuZ2V0KHJlcXVlc3RPcHRzLCAocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICBjb25zdCBpc1Jlc3BvbnNlRXJyb3IgPSByZXNwb25zZS5zdGF0dXNDb2RlICE9PSAyMDA7XG5cbiAgICAgICAgICByZXNwb25zZS5vbihcImZpbmlzaFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgUmVzcG9uc2UgZmluaXNoZWQgZm9yICR7dXJsU3RyaW5nfWApO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc3BvbnNlLm9uKFwiY2xvc2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYERvd25sb2FkIGNvbm5lY3Rpb24gY2xvc2VkIGZvciAke3VybFN0cmluZ31gKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXNwb25zZS5vbihcImVycm9yXCIsIChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYERvd25sb2FkIG9mICR7ZmlsZW5hbWV9IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgICAgZmlsZVdyaXRlci5jbG9zZSgpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGZpbGVXcml0ZXIub24oXCJjbG9zZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgRmlsZS5jbG9zZSAke2ZpbGVuYW1lfSBzYXZlZCB0byAke2ZpbGVQYXRofWApO1xuICAgICAgICAgICAgaWYgKGlzUmVzcG9uc2VFcnJvcikge1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGBIVFRQICR7cmVzcG9uc2Uuc3RhdHVzQ29kZX1gKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXNwb25zZS5waXBlKGZpbGVXcml0ZXIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJ0aW1lb3V0XCIsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBEb3dubG9hZCBvZiAke2ZpbGVuYW1lfSB0aW1lZCBvdXRgKTtcbiAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFJlcXVlc3QgZm9yICR7ZmlsZW5hbWV9IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgLy8gVHJ5IHRvIGRvd25sb2FkIHRoZSBmaWxlLCByZXRyeSB1cCB0byBgbWF4UmV0cmllc2AgdGltZXMgaWYgdGhlIGF0dGVtcHQgZmFpbHNcbiAgZm9yIChsZXQgYXR0ZW1wdCA9IDA7IGF0dGVtcHQgPCBtYXhSZXRyaWVzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgY29uc29sZS5sb2coXG4gICAgICAgIGBEb3dubG9hZGluZzogJHtleGVjdXRhYmxlLmZpbGVuYW1lfSBmcm9tOiAke2V4ZWN1dGFibGUuZG93bmxvYWRVcmx9YFxuICAgICAgKTtcbiAgICAgIGF3YWl0IGRvRG93bmxvYWQoZXhlY3V0YWJsZS5kb3dubG9hZFVybCwgZXhlY3V0YWJsZS5maWxlbmFtZSk7XG4gICAgICBjb25zb2xlLmxvZyhgRG93bmxvYWQgc3VjY2Vzc2Z1bCBmb3IgJHtleGVjdXRhYmxlLmZpbGVuYW1lfWApO1xuICAgICAgcmV0dXJuO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICBgRG93bmxvYWQgb2YgJHtleGVjdXRhYmxlLmZpbGVuYW1lfSBmYWlsZWQ6ICR7ZXJyLm1lc3NhZ2V9YFxuICAgICAgKTtcblxuICAgICAgLy8gRG9uJ3Qgd2FpdCBiZWZvcmUgcmV0cnlpbmcgdGhlIGxhc3QgYXR0ZW1wdFxuICAgICAgaWYgKGF0dGVtcHQgPCBtYXhSZXRyaWVzIC0gMSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICBgUmV0cnlpbmcgZG93bmxvYWQgb2YgJHtleGVjdXRhYmxlLmZpbGVuYW1lfSBmcm9tICR7ZXhlY3V0YWJsZS5kb3dubG9hZFVybH0gYWZ0ZXIgNSBzZWNvbmRzLi4uYFxuICAgICAgICApO1xuICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIGBBbGwgcmV0cmllcyBmYWlsZWQgZm9yICR7ZXhlY3V0YWJsZS5maWxlbmFtZX0gZnJvbSAke2V4ZWN1dGFibGUuZG93bmxvYWRVcmx9OiAke2Vyci5tZXNzYWdlfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbWFrZUh0dHBzQ2FsbCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaHR0cHNcbiAgICAgIC5nZXQodXJsLCAocmVzKSA9PiB7XG4gICAgICAgIGxldCBkYXRhOiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgICAgIC8vIEhhbmRsZSBpbmNvbWluZyBkYXRhIGNodW5rc1xuICAgICAgICByZXMub24oXCJkYXRhXCIsIChjaHVuaykgPT4ge1xuICAgICAgICAgIGRhdGEgKz0gY2h1bms7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRoZSB3aG9sZSByZXNwb25zZSBoYXMgYmVlbiByZWNlaXZlZFxuICAgICAgICByZXMub24oXCJlbmRcIiwgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzcG9uc2UgRGF0YTpcIiwgcGFyc2VkRGF0YSk7XG4gICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZWplY3QoYEVycm9yIHBhcnNpbmcgcmVzcG9uc2U6ICR7ZXJyb3J9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcbiAgICAgICAgcmVqZWN0KGBIVFRQUyByZXF1ZXN0IGZhaWxlZDogJHtlcnJvcn1gKTtcbiAgICAgIH0pO1xuICB9KTtcbn1cbiJdfQ==