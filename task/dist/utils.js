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
exports.downloadBinary = exports.setupEndorctl = exports.fetchLatestEndorctlVersion = exports.isVersionResponse = exports.isObject = exports.getEndorctlChecksum = exports.getPlatformInfo = exports.createHashFromFile = void 0;
const https = __importStar(require("https"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const os_1 = require("os");
/**
 * Create a hash from a file
 */
const createHashFromFile = (filePath) => new Promise((resolve) => {
    const hash = crypto.createHash("sha256");
    fs.createReadStream(filePath)
        .on("data", (data) => hash.update(data))
        .on("end", () => resolve(hash.digest("hex")));
});
exports.createHashFromFile = createHashFromFile;
/**
 * Returns the OS and Architecture to be used for downloading endorctl binary,
 * based on the current host OS and Architecture. Returns the error if host
 * OS/Arch combination is not supported
 */
const getPlatformInfo = (platform, architecture) => {
    const osSuffixes = {
        [tl.Platform.Linux]: "linux",
        [tl.Platform.Windows]: "windows",
        [tl.Platform.MacOS]: "macos",
    };
    return {
        os: osSuffixes[platform],
        arch: osSuffixes[platform] === "macos" && architecture.startsWith("arm")
            ? "arm64"
            : "amd64",
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
/**
 * Downloads the endorctl binary and returns the path to the downloaded binary
 */
const setupEndorctl = async ({ version, checksum, api, }) => {
    try {
        const platform = (0, exports.getPlatformInfo)(tl.getPlatform(), (0, os_1.arch)());
        const isWindows = platform.os === "windows";
        console.info(`Host Platform: ${platform.os} ${platform.arch}`);
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
            throw new Error("Agent.TempDirectory is not set"); // this is set by Azure Pipelines environment
        }
        await downloadBinary(endorctlDir, {
            filename: binaryName,
            downloadUrl: url,
        });
        const hash = await (0, exports.createHashFromFile)(path.join(endorctlDir, binaryName));
        if (hash !== endorctlChecksum) {
            throw new Error("The checksum of the endorctl downloaded binary does not match the expected value!");
        }
        else {
            console.info(`Binary checksum: ${endorctlChecksum}`);
        }
        console.info(`Endorctl downloaded at ${endorctlDir}`);
        return `${endorctlDir}${path.sep}endorctl${isWindows ? ".exe" : ""}`;
    }
    catch (error) {
        console.info("failed to download endorctl.");
        console.info(error);
    }
    return "";
};
exports.setupEndorctl = setupEndorctl;
/**
 * Downloads the executable from the given URL to the target directory
 */
async function downloadBinary(targetDirectory, fileInfo) {
    const filePath = path.join(targetDirectory, fileInfo.filename);
    console.log(`Downloading endorctl binary to: ${filePath}`);
    // Check if the file already exists
    if (fs.existsSync(filePath)) {
        console.log(`endorctl binary ${fileInfo.filename} already exists, skipping download.`);
        return;
    }
    const downloadEndorctlFunc = (urlString, filename) => new Promise((resolve, reject) => {
        const fileWriter = fs.createWriteStream(filePath, {
            mode: 0o766,
        });
        const url = new URL(urlString);
        const requestOpts = {
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
                }
                else {
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
            console.error(`Download request for endorctl binary ${filename} failed: ${err.message}`);
            reject(err);
        });
    });
    try {
        console.log(`Downloading endorctl: ${fileInfo.filename} from url: ${fileInfo.downloadUrl}`);
        await downloadEndorctlFunc(fileInfo.downloadUrl, fileInfo.filename);
        console.log(`Successfully downloaded ${fileInfo.filename} file.`);
        return;
    }
    catch (err) {
        console.error(`Failed to download ${fileInfo.filename}: ${err.message}`);
    }
}
exports.downloadBinary = downloadBinary;
/**
 * Make an HTTPS request and return the response body
 */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsK0NBQWlDO0FBQ2pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0Isa0VBQW9EO0FBR3BELDJCQUEwQjtBQU8xQjs7R0FFRztBQUNJLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxRQUFnQixFQUFFLEVBQUUsQ0FDckQsSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUN0QixNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7U0FDMUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2QyxFQUFFLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsRCxDQUFDLENBQUMsQ0FBQztBQU5RLFFBQUEsa0JBQWtCLHNCQU0xQjtBQUVMOzs7O0dBSUc7QUFDSSxNQUFNLGVBQWUsR0FBRyxDQUM3QixRQUFxQixFQUNyQixZQUFvQixFQUNwQixFQUFFO0lBQ0YsTUFBTSxVQUFVLEdBQWdDO1FBQzlDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPO1FBQzVCLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTO1FBQ2hDLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPO0tBQzdCLENBQUM7SUFFRixPQUFPO1FBQ0wsRUFBRSxFQUFFLFVB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YUFBYSxDQUFDLEdBQVc7SUFDdEMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxLQUFLO2FBQ0YsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ2hCLElBQUksSUFBSSxHQUFXLEVBQUUsQ0FBQztZQUV0Qiw4QkFBOEI7WUFDOUIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDdkIsSUFBSSxJQUFJLEtBQUssQ0FBQztZQUNoQixDQUFDLENBQUMsQ0FBQztZQUVILHVDQUF1QztZQUN2QyxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUU7Z0JBQ2pCLElBQUk7b0JBQ0YsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQztvQkFDMUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNmO2dCQUFDLE9BQU8sS0FBSyxFQUFFO29CQUNkLE1BQU0sQ0FBQywyQkFBMkIsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDNUM7WUFDSCxDQUFDLENBQUMsQ0FBQztRQUNMLENBQUMsQ0FBQzthQUNELEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtZQUNyQixNQUFNLENBQUMseUJBQXlCLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBodHRwcyBmcm9tIFwiaHR0cHNcIjtcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIHRsIGZyb20gXCJhenVyZS1waXBlbGluZXMtdGFzay1saWIvdGFza1wiO1xuXG5pbXBvcnQgeyBDbGllbnRDaGVja3N1bXNUeXBlLCBTZXR1cFByb3BzLCBWZXJzaW9uUmVzcG9uc2UgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgYXJjaCB9IGZyb20gXCJvc1wiO1xuXG5leHBvcnQgdHlwZSBCaW5hcnlGaWxlSW5mbyA9IHtcbiAgZmlsZW5hbWU6IHN0cmluZztcbiAgZG93bmxvYWRVcmw6IHN0cmluZztcbn07XG5cbi8qKlxuICogQ3JlYXRlIGEgaGFzaCBmcm9tIGEgZmlsZVxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlSGFzaEZyb21GaWxlID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+XG4gIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKFwic2hhMjU2XCIpO1xuICAgIGZzLmNyZWF0ZVJlYWRTdHJlYW0oZmlsZVBhdGgpXG4gICAgICAub24oXCJkYXRhXCIsIChkYXRhKSA9PiBoYXNoLnVwZGF0ZShkYXRhKSlcbiAgICAgIC5vbihcImVuZFwiLCAoKSA9PiByZXNvbHZlKGhhc2guZGlnZXN0KFwiaGV4XCIpKSk7XG4gIH0pO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIE9TIGFuZCBBcmNoaXRlY3R1cmUgdG8gYmUgdXNlZCBmb3IgZG93bmxvYWRpbmcgZW5kb3JjdGwgYmluYXJ5LFxuICogYmFzZWQgb24gdGhlIGN1cnJlbnQgaG9zdCBPUyBhbmQgQXJjaGl0ZWN0dXJlLiBSZXR1cm5zIHRoZSBlcnJvciBpZiBob3N0XG4gKiBPUy9BcmNoIGNvbWJpbmF0aW9uIGlzIG5vdCBzdXBwb3J0ZWRcbiAqL1xuZXhwb3J0IGNvbnN0IGdldFBsYXRmb3JtSW5mbyA9IChcbiAgcGxhdGZvcm06IHRsLlBsYXRmb3JtLFxuICBhcmNoaXRlY3R1cmU6IHN0cmluZ1xuKSA9PiB7XG4gIGNvbnN0IG9zU3VmZml4ZXM6IFJlY29yZDx0bC5QbGF0Zm9ybSwgc3RyaW5nPiA9IHtcbiAgICBbdGwuUGxhdGZvcm0uTGludXhdOiBcImxpbnV4XCIsXG4gICAgW3RsLlBsYXRmb3JtLldpbmRvd3NdOiBcIndpbmRvd3NcIixcbiAgICBbdGwuUGxhdGZvcm0uTWFjT1NdOiBcIm1hY29zXCIsXG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBvczogb3NTdWZmaXhlc1twbGF0Zm9ybV0sXG4gICAgYXJjaDpcbiAgICAgIG9zU3VmZml4ZXNbcGxhdGZvcm1dID09PSBcIm1hY29zXCIgJiYgYXJjaGl0ZWN0dXJlLnN0YXJ0c1dpdGgoXCJhcm1cIilcbiAgICAgICAgPyBcImFybTY0XCJcbiAgICAgICAgOiBcImFtZDY0XCIsXG4gIH07XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGNoZWNrc3VtIGZvciB0aGUgZ2l2ZW4gT1MgYW5kIEFyY2hpdGVjdHVyZVxuICovXG5leHBvcnQgY29uc3QgZ2V0RW5kb3JjdGxDaGVja3N1bSA9IChcbiAgY2xpZW50Q2hlY2tzdW1zOiBDbGllbnRDaGVja3N1bXNUeXBlLFxuICBvcz86IHN0cmluZyxcbiAgYXJjaD86IHN0cmluZ1xuKSA9PiB7XG4gIGNvbnN0IHBsYXRmb3JtU3RyaW5nID0gYCR7b3N9XyR7YXJjaH1gO1xuICBzd2l0Y2ggKHBsYXRmb3JtU3RyaW5nKSB7XG4gICAgY2FzZSBgbGludXhfYW1kNjRgOlxuICAgICAgcmV0dXJuIGNsaWVudENoZWNrc3Vtcy5BUkNIX1RZUEVfTElOVVhfQU1ENjQ7XG4gICAgY2FzZSBgbWFjb3NfYW1kNjRgOlxuICAgICAgcmV0dXJuIGNsaWVudENoZWNrc3Vtcy5BUkNIX1RZUEVfTUFDT1NfQU1ENjQ7XG4gICAgY2FzZSBgbWFjb3NfYXJtNjRgOlxuICAgICAgcmV0dXJuIGNsaWVudENoZWNrc3Vtcy5BUkNIX1RZUEVfTUFDT1NfQVJNNjQ7XG4gICAgY2FzZSBgd2luZG93c19hbWQ2NGA6XG4gICAgICByZXR1cm4gY2xpZW50Q2hlY2tzdW1zLkFSQ0hfVFlQRV9XSU5ET1dTX0FNRDY0O1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gXCJcIjtcbiAgfVxufTtcblxuLyoqXG4gKiBUeXBlIGd1YXJkIGZvciBvYmplY3QvUmVjb3JkXG4gKi9cbmV4cG9ydCBjb25zdCBpc09iamVjdCA9ICh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgcmV0dXJuIFwib2JqZWN0XCIgPT09IHR5cGVvZiB2YWx1ZSAmJiBudWxsICE9PSB2YWx1ZTtcbn07XG5cbi8qKlxuICogVHlwZSBndWFyZCBmb3IgVmVyc2lvblJlc3BvbnNlXG4gKi9cbmV4cG9ydCBjb25zdCBpc1ZlcnNpb25SZXNwb25zZSA9ICh2YWx1ZTogdW5rbm93bik6IHZhbHVlIGlzIFZlcnNpb25SZXNwb25zZSA9PiB7XG4gIHJldHVybiAoXG4gICAgaXNPYmplY3QodmFsdWUpICYmXG4gICAgLy8gZXhwZWN0OiBgU2VydmljZWAgcHJvcGVydHkgZXhpc3RzXG4gICAgXCJTZXJ2aWNlXCIgaW4gdmFsdWUgJiZcbiAgICBpc09iamVjdCh2YWx1ZS5TZXJ2aWNlKSAmJlxuICAgIC8vIGV4cGVjdDogYFNlcnZpY2VgIHByb3BlcnR5IGV4aXN0c1xuICAgIFwiQ2xpZW50Q2hlY2tzdW1zXCIgaW4gdmFsdWUgJiZcbiAgICBpc09iamVjdCh2YWx1ZS5DbGllbnRDaGVja3N1bXMpXG4gICk7XG59O1xuXG4vKipcbiAqIEB0aHJvd3Mge0Vycm9yfSB3aGVuIGFwaSBpcyB1bnJlYWNoYWJsZSBvciByZXR1cm5zIGludmFsaWQgcmVzcG9uc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGZldGNoTGF0ZXN0RW5kb3JjdGxWZXJzaW9uID0gYXN5bmMgKGFwaTogc3RyaW5nIHwgdW5kZWZpbmVkKSA9PiB7XG4gIGNvbnN0IGJvZHkgPSBhd2FpdCBtYWtlSHR0cHNDYWxsKGAke2FwaX0vbWV0YS92ZXJzaW9uYCk7XG5cbiAgbGV0IGRhdGE6IFZlcnNpb25SZXNwb25zZSB8IHVuZGVmaW5lZDtcbiAgdHJ5IHtcbiAgICBkYXRhID0gSlNPTi5wYXJzZShib2R5KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcmVzcG9uc2UgZnJvbSBFbmRvciBMYWJzIEFQSTogXFxgJHtib2R5fVxcYGApO1xuICB9XG5cbiAgaWYgKCFpc1ZlcnNpb25SZXNwb25zZShkYXRhKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZXNwb25zZSBmcm9tIEVuZG9yIExhYnMgQVBJOiBcXGAke2JvZHl9XFxgYCk7XG4gIH1cblxuICBpZiAoIWRhdGEuQ2xpZW50VmVyc2lvbikge1xuICAgIGRhdGEuQ2xpZW50VmVyc2lvbiA9IGRhdGEuU2VydmljZS5WZXJzaW9uO1xuICB9XG5cbiAgcmV0dXJuIGRhdGE7XG59O1xuXG4vKipcbiAqIERvd25sb2FkcyB0aGUgZW5kb3JjdGwgYmluYXJ5IGFuZCByZXR1cm5zIHRoZSBwYXRoIHRvIHRoZSBkb3dubG9hZGVkIGJpbmFyeVxuICovXG5leHBvcnQgY29uc3Qgc2V0dXBFbmRvcmN0bCA9IGFzeW5jICh7XG4gIHZlcnNpb24sXG4gIGNoZWNrc3VtLFxuICBhcGksXG59OiBTZXR1cFByb3BzKTogUHJvbWlzZTxzdHJpbmc+ID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwbGF0Zm9ybSA9IGdldFBsYXRmb3JtSW5mbyh0bC5nZXRQbGF0Zm9ybSgpLCBhcmNoKCkpO1xuICAgIGNvbnN0IGlzV2luZG93cyA9IHBsYXRmb3JtLm9zID09PSBcIndpbmRvd3NcIjtcblxuICAgIGNvbnNvbGUuaW5mbyhgSG9zdCBQbGF0Zm9ybTogJHtwbGF0Zm9ybS5vc30gJHtwbGF0Zm9ybS5hcmNofWApO1xuXG4gICAgbGV0IGVuZG9yY3RsVmVyc2lvbiA9IHZlcnNpb247XG4gICAgbGV0IGVuZG9yY3RsQ2hlY2tzdW0gPSBjaGVja3N1bTtcbiAgICBpZiAoIXZlcnNpb24pIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhgRW5kb3JjdGwgdmVyc2lvbiBub3QgcHJvdmlkZWQsIHVzaW5nIGxhdGVzdCB2ZXJzaW9uYCk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaExhdGVzdEVuZG9yY3RsVmVyc2lvbihhcGkpO1xuICAgICAgZW5kb3JjdGxWZXJzaW9uID0gZGF0YS5DbGllbnRWZXJzaW9uO1xuICAgICAgZW5kb3JjdGxDaGVja3N1bSA9IGdldEVuZG9yY3RsQ2hlY2tzdW0oXG4gICAgICAgIGRhdGEuQ2xpZW50Q2hlY2tzdW1zLFxuICAgICAgICBwbGF0Zm9ybS5vcyxcbiAgICAgICAgcGxhdGZvcm0uYXJjaFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYERvd25sb2FkaW5nIGVuZG9yY3RsIHZlcnNpb24gJHtlbmRvcmN0bFZlcnNpb259YCk7XG4gICAgY29uc3QgdXJsID0gYCR7YXBpfS9kb3dubG9hZC9lbmRvcmxhYnMvJHtlbmRvcmN0bFZlcnNpb259L2JpbmFyaWVzL2VuZG9yY3RsXyR7ZW5kb3JjdGxWZXJzaW9ufV8ke1xuICAgICAgcGxhdGZvcm0ub3NcbiAgICB9XyR7cGxhdGZvcm0uYXJjaH0ke2lzV2luZG93cyA/IFwiLmV4ZVwiIDogXCJcIn1gO1xuICAgIGNvbnN0IGJpbmFyeU5hbWUgPSBgZW5kb3JjdGwke2lzV2luZG93cyA/IFwiLmV4ZVwiIDogXCJcIn1gO1xuXG4gICAgbGV0IGVuZG9yY3RsRGlyOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgZW5kb3JjdGxEaXIgPSB0bC5nZXRWYXJpYWJsZShcIkFnZW50LlRlbXBEaXJlY3RvcnlcIik7XG4gICAgaWYgKCFlbmRvcmN0bERpcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQWdlbnQuVGVtcERpcmVjdG9yeSBpcyBub3Qgc2V0XCIpOyAvLyB0aGlzIGlzIHNldCBieSBBenVyZSBQaXBlbGluZXMgZW52aXJvbm1lbnRcbiAgICB9XG5cbiAgICBhd2FpdCBkb3dubG9hZEJpbmFyeShlbmRvcmN0bERpciwge1xuICAgICAgZmlsZW5hbWU6IGJpbmFyeU5hbWUsXG4gICAgICBkb3dubG9hZFVybDogdXJsLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IGNyZWF0ZUhhc2hGcm9tRmlsZShwYXRoLmpvaW4oZW5kb3JjdGxEaXIsIGJpbmFyeU5hbWUpKTtcbiAgICBpZiAoaGFzaCAhPT0gZW5kb3JjdGxDaGVja3N1bSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIlRoZSBjaGVja3N1bSBvZiB0aGUgZW5kb3JjdGwgZG93bmxvYWRlZCBiaW5hcnkgZG9lcyBub3QgbWF0Y2ggdGhlIGV4cGVjdGVkIHZhbHVlIVwiXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmluZm8oYEJpbmFyeSBjaGVja3N1bTogJHtlbmRvcmN0bENoZWNrc3VtfWApO1xuICAgIH1cblxuICAgIGNvbnNvbGUuaW5mbyhgRW5kb3JjdGwgZG93bmxvYWRlZCBhdCAke2VuZG9yY3RsRGlyfWApO1xuICAgIHJldHVybiBgJHtlbmRvcmN0bERpcn0ke3BhdGguc2VwfWVuZG9yY3RsJHtpc1dpbmRvd3MgPyBcIi5leGVcIiA6IFwiXCJ9YDtcbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgIGNvbnNvbGUuaW5mbyhcImZhaWxlZCB0byBkb3dubG9hZCBlbmRvcmN0bC5cIik7XG4gICAgY29uc29sZS5pbmZvKGVycm9yKTtcbiAgfVxuXG4gIHJldHVybiBcIlwiO1xufTtcblxuLyoqXG4gKiBEb3dubG9hZHMgdGhlIGV4ZWN1dGFibGUgZnJvbSB0aGUgZ2l2ZW4gVVJMIHRvIHRoZSB0YXJnZXQgZGlyZWN0b3J5XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZEJpbmFyeShcbiAgdGFyZ2V0RGlyZWN0b3J5OiBzdHJpbmcsXG4gIGZpbGVJbmZvOiBCaW5hcnlGaWxlSW5mb1xuKSB7XG4gIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRhcmdldERpcmVjdG9yeSwgZmlsZUluZm8uZmlsZW5hbWUpO1xuICBjb25zb2xlLmxvZyhgRG93bmxvYWRpbmcgZW5kb3JjdGwgYmluYXJ5IHRvOiAke2ZpbGVQYXRofWApO1xuXG4gIC8vIENoZWNrIGlmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzXG4gIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYGVuZG9yY3RsIGJpbmFyeSAke2ZpbGVJbmZvLmZpbGVuYW1lfSBhbHJlYWR5IGV4aXN0cywgc2tpcHBpbmcgZG93bmxvYWQuYFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZG93bmxvYWRFbmRvcmN0bEZ1bmMgPSAodXJsU3RyaW5nOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpID0+XG4gICAgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgZmlsZVdyaXRlciA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVQYXRoLCB7XG4gICAgICAgIG1vZGU6IDBvNzY2LFxuICAgICAgfSk7XG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHVybFN0cmluZyk7XG4gICAgICBjb25zdCByZXF1ZXN0T3B0czogaHR0cHMuUmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICAgIGhvc3Q6IHVybC5ob3N0bmFtZSxcbiAgICAgICAgcGF0aDogdXJsLnBhdGhuYW1lLFxuICAgICAgICB0aW1lb3V0OiAzMDAwMDAsXG4gICAgICB9O1xuXG4gICAgICBodHRwc1xuICAgICAgICAuZ2V0KHJlcXVlc3RPcHRzLCAocmVzKSA9PiB7XG4gICAgICAgICAgcmVzLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgZW5kb3JjdGwgYmluYXJ5IGRvd25sb2FkIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY29uc3QgcmVzcEVycm9yID0gcmVzLnN0YXR1c0NvZGUgIT09IDIwMDtcbiAgICAgICAgICBpZiAocmVzcEVycm9yKSB7XG4gICAgICAgICAgICBmaWxlV3JpdGVyLmNsb3NlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmlsZVdyaXRlci5vbihcImNsb3NlXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGAke2ZpbGVuYW1lfSBzYXZlZCB0byAke2ZpbGVQYXRofWApO1xuICAgICAgICAgICAgaWYgKHJlc3BFcnJvcikge1xuICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGAke3Jlcy5zdGF0dXNDb2RlfWApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJlcy5waXBlKGZpbGVXcml0ZXIpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJ0aW1lb3V0XCIsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBEb3dubG9hZCBvZiAke2ZpbGVuYW1lfSB0aW1lZCBvdXRgKTtcbiAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICBgRG93bmxvYWQgcmVxdWVzdCBmb3IgZW5kb3JjdGwgYmluYXJ5ICR7ZmlsZW5hbWV9IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcbiAgICAgIGBEb3dubG9hZGluZyBlbmRvcmN0bDogJHtmaWxlSW5mby5maWxlbmFtZX0gZnJvbSB1cmw6ICR7ZmlsZUluZm8uZG93bmxvYWRVcmx9YFxuICAgICk7XG4gICAgYXdhaXQgZG93bmxvYWRFbmRvcmN0bEZ1bmMoZmlsZUluZm8uZG93bmxvYWRVcmwsIGZpbGVJbmZvLmZpbGVuYW1lKTtcbiAgICBjb25zb2xlLmxvZyhgU3VjY2Vzc2Z1bGx5IGRvd25sb2FkZWQgJHtmaWxlSW5mby5maWxlbmFtZX0gZmlsZS5gKTtcbiAgICByZXR1cm47XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGRvd25sb2FkICR7ZmlsZUluZm8uZmlsZW5hbWV9OiAke2Vyci5tZXNzYWdlfWApO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBIVFRQUyByZXF1ZXN0IGFuZCByZXR1cm4gdGhlIHJlc3BvbnNlIGJvZHlcbiAqL1xuYXN5bmMgZnVuY3Rpb24gbWFrZUh0dHBzQ2FsbCh1cmw6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaHR0cHNcbiAgICAgIC5nZXQodXJsLCAocmVzKSA9PiB7XG4gICAgICAgIGxldCBkYXRhOiBzdHJpbmcgPSBcIlwiO1xuXG4gICAgICAgIC8vIEhhbmRsZSBpbmNvbWluZyBkYXRhIGNodW5rc1xuICAgICAgICByZXMub24oXCJkYXRhXCIsIChjaHVuaykgPT4ge1xuICAgICAgICAgIGRhdGEgKz0gY2h1bms7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIFRoZSB3aG9sZSByZXNwb25zZSBoYXMgYmVlbiByZWNlaXZlZFxuICAgICAgICByZXMub24oXCJlbmRcIiwgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWREYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzcG9uc2UgRGF0YTpcIiwgcGFyc2VkRGF0YSk7XG4gICAgICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZWplY3QoYEVycm9yIHBhcnNpbmcgcmVzcG9uc2U6ICR7ZXJyb3J9YCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pXG4gICAgICAub24oXCJlcnJvclwiLCAoZXJyb3IpID0+IHtcbiAgICAgICAgcmVqZWN0KGBIVFRQUyByZXF1ZXN0IGZhaWxlZDogJHtlcnJvcn1gKTtcbiAgICAgIH0pO1xuICB9KTtcbn1cbiJdfQ==