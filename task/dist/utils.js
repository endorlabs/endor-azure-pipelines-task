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
const commandExists = (command) => {
    try {
        const platform = (0, exports.getPlatformInfo)(tl.getPlatform(), (0, os_1.arch)());
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
/**
 * Downloads the executable from the given URL to the target directory
 */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IsK0NBQWlDO0FBQ2pDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFDN0IsaURBQXlDO0FBQ3pDLGtFQUFvRDtBQUdwRCwyQkFBMEI7QUFPMUI7O0dBRUc7QUFDSSxNQUFNLGtCQUFrQixHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQ3JELElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7SUFDdEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN6QyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDO1NBQzFCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkMsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEQsQ0FBQyxDQUFDLENBQUM7QUFOUSxRQUFBLGtCQUFrQixzQkFNMUI7QUFFRSxNQUFNLGFBQWEsR0FBRyxDQUFDLE9BQWUsRUFBRSxFQUFFO0lBQy9DLElBQUk7UUFDRixNQUFNLFFBQVEsR0FBRyxJQUFBLHVCQUFlLEVBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLElBQUEsU0FBSSxHQUFFLENBQUMsQ0FBQztRQUMzRCxNQUFNLEdBQUcsR0FDUCxRQUFRLENBQUMsRUFBRSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsU0FBUyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxPQUFPLEVBQUUsQ0FBQztRQUV0RSxJQUFBLHdCQUFRLEVB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QUFDLENBQUM7SUFDUCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBodHRwcyBmcm9tIFwiaHR0cHNcIjtcbmltcG9ydCAqIGFzIGNyeXB0byBmcm9tIFwiY3J5cHRvXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCAqIGFzIHRsIGZyb20gXCJhenVyZS1waXBlbGluZXMtdGFzay1saWIvdGFza1wiO1xuXG5pbXBvcnQgeyBDbGllbnRDaGVja3N1bXNUeXBlLCBTZXR1cFByb3BzLCBWZXJzaW9uUmVzcG9uc2UgfSBmcm9tIFwiLi90eXBlc1wiO1xuaW1wb3J0IHsgYXJjaCB9IGZyb20gXCJvc1wiO1xuXG5leHBvcnQgdHlwZSBFeGVjdXRhYmxlID0ge1xuICBmaWxlbmFtZTogc3RyaW5nO1xuICBkb3dubG9hZFVybDogc3RyaW5nO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYSBoYXNoIGZyb20gYSBmaWxlXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVIYXNoRnJvbUZpbGUgPSAoZmlsZVBhdGg6IHN0cmluZykgPT5cbiAgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICBjb25zdCBoYXNoID0gY3J5cHRvLmNyZWF0ZUhhc2goXCJzaGEyNTZcIik7XG4gICAgZnMuY3JlYXRlUmVhZFN0cmVhbShmaWxlUGF0aClcbiAgICAgIC5vbihcImRhdGFcIiwgKGRhdGEpID0+IGhhc2gudXBkYXRlKGRhdGEpKVxuICAgICAgLm9uKFwiZW5kXCIsICgpID0+IHJlc29sdmUoaGFzaC5kaWdlc3QoXCJoZXhcIikpKTtcbiAgfSk7XG5cbmV4cG9ydCBjb25zdCBjb21tYW5kRXhpc3RzID0gKGNvbW1hbmQ6IHN0cmluZykgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm1JbmZvKHRsLmdldFBsYXRmb3JtKCksIGFyY2goKSk7XG4gICAgY29uc3QgY21kID1cbiAgICAgIHBsYXRmb3JtLm9zID09PSBcIndpbmRvd3NcIiA/IGB3aGVyZSAke2NvbW1hbmR9YCA6IGB3aGljaCAke2NvbW1hbmR9YDtcblxuICAgIGV4ZWNTeW5jKGNtZCwgeyBzdGRpbzogXCJpZ25vcmVcIiB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgT1MgYW5kIEFyY2hpdGVjdHVyZSB0byBiZSB1c2VkIGZvciBkb3dubG9hZGluZyBlbmRvcmN0bCBiaW5hcnksXG4gKiBiYXNlZCBvbiB0aGUgY3VycmVudCBob3N0IE9TIGFuZCBBcmNoaXRlY3R1cmUuIFJldHVybnMgdGhlIGVycm9yIGlmIGhvc3RcbiAqIE9TL0FyY2ggY29tYmluYXRpb24gaXMgbm90IHN1cHBvcnRlZFxuICovXG5leHBvcnQgY29uc3QgZ2V0UGxhdGZvcm1JbmZvID0gKFxuICBwbGF0Zm9ybTogdGwuUGxhdGZvcm0sXG4gIGFyY2hpdGVjdHVyZTogc3RyaW5nXG4pID0+IHtcbiAgY29uc3Qgb3NTdWZmaXhlczogUmVjb3JkPHRsLlBsYXRmb3JtLCBzdHJpbmc+ID0ge1xuICAgIFt0bC5QbGF0Zm9ybS5MaW51eF06IFwibGludXhcIixcbiAgICBbdGwuUGxhdGZvcm0uV2luZG93c106IFwid2luZG93c1wiLFxuICAgIFt0bC5QbGF0Zm9ybS5NYWNPU106IFwibWFjb3NcIixcbiAgfTtcblxuICByZXR1cm4ge1xuICAgIG9zOiBvc1N1ZmZpeGVzW3BsYXRmb3JtXSxcbiAgICBhcmNoOlxuICAgICAgb3NTdWZmaXhlc1twbGF0Zm9ybV0gPT09IFwibWFjb3NcIiAmJiBhcmNoaXRlY3R1cmUuc3RhcnRzV2l0aChcImFybVwiKVxuICAgICAgICA/IFwiYXJtNjRcIlxuICAgICAgICA6IFwiYW1kNjRcIixcbiAgfTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY2hlY2tzdW0gZm9yIHRoZSBnaXZlbiBPUyBhbmQgQXJjaGl0ZWN0dXJlXG4gKi9cbmV4cG9ydCBjb25zdCBnZXRFbmRvcmN0bENoZWNrc3VtID0gKFxuICBjbGllbnRDaGVja3N1bXM6IENsaWVudENoZWNrc3Vtc1R5cGUsXG4gIG9zPzogc3RyaW5nLFxuICBhcmNoPzogc3RyaW5nXG4pID0+IHtcbiAgY29uc3QgcGxhdGZvcm1TdHJpbmcgPSBgJHtvc31fJHthcmNofWA7XG4gIHN3aXRjaCAocGxhdGZvcm1TdHJpbmcpIHtcbiAgICBjYXNlIGBsaW51eF9hbWQ2NGA6XG4gICAgICByZXR1cm4gY2xpZW50Q2hlY2tzdW1zLkFSQ0hfVFlQRV9MSU5VWF9BTUQ2NDtcbiAgICBjYXNlIGBtYWNvc19hbWQ2NGA6XG4gICAgICByZXR1cm4gY2xpZW50Q2hlY2tzdW1zLkFSQ0hfVFlQRV9NQUNPU19BTUQ2NDtcbiAgICBjYXNlIGBtYWNvc19hcm02NGA6XG4gICAgICByZXR1cm4gY2xpZW50Q2hlY2tzdW1zLkFSQ0hfVFlQRV9NQUNPU19BUk02NDtcbiAgICBjYXNlIGB3aW5kb3dzX2FtZDY0YDpcbiAgICAgIHJldHVybiBjbGllbnRDaGVja3N1bXMuQVJDSF9UWVBFX1dJTkRPV1NfQU1ENjQ7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBcIlwiO1xuICB9XG59O1xuXG4vKipcbiAqIFR5cGUgZ3VhcmQgZm9yIG9iamVjdC9SZWNvcmRcbiAqL1xuZXhwb3J0IGNvbnN0IGlzT2JqZWN0ID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj4gPT4ge1xuICByZXR1cm4gXCJvYmplY3RcIiA9PT0gdHlwZW9mIHZhbHVlICYmIG51bGwgIT09IHZhbHVlO1xufTtcblxuLyoqXG4gKiBUeXBlIGd1YXJkIGZvciBWZXJzaW9uUmVzcG9uc2VcbiAqL1xuZXhwb3J0IGNvbnN0IGlzVmVyc2lvblJlc3BvbnNlID0gKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgVmVyc2lvblJlc3BvbnNlID0+IHtcbiAgcmV0dXJuIChcbiAgICBpc09iamVjdCh2YWx1ZSkgJiZcbiAgICAvLyBleHBlY3Q6IGBTZXJ2aWNlYCBwcm9wZXJ0eSBleGlzdHNcbiAgICBcIlNlcnZpY2VcIiBpbiB2YWx1ZSAmJlxuICAgIGlzT2JqZWN0KHZhbHVlLlNlcnZpY2UpICYmXG4gICAgLy8gZXhwZWN0OiBgU2VydmljZWAgcHJvcGVydHkgZXhpc3RzXG4gICAgXCJDbGllbnRDaGVja3N1bXNcIiBpbiB2YWx1ZSAmJlxuICAgIGlzT2JqZWN0KHZhbHVlLkNsaWVudENoZWNrc3VtcylcbiAgKTtcbn07XG5cbi8qKlxuICogQHRocm93cyB7RXJyb3J9IHdoZW4gYXBpIGlzIHVucmVhY2hhYmxlIG9yIHJldHVybnMgaW52YWxpZCByZXNwb25zZVxuICovXG5leHBvcnQgY29uc3QgZmV0Y2hMYXRlc3RFbmRvcmN0bFZlcnNpb24gPSBhc3luYyAoYXBpOiBzdHJpbmcgfCB1bmRlZmluZWQpID0+IHtcbiAgY29uc3QgYm9keSA9IGF3YWl0IG1ha2VIdHRwc0NhbGwoYCR7YXBpfS9tZXRhL3ZlcnNpb25gKTtcblxuICBsZXQgZGF0YTogVmVyc2lvblJlc3BvbnNlIHwgdW5kZWZpbmVkO1xuICB0cnkge1xuICAgIGRhdGEgPSBKU09OLnBhcnNlKGJvZHkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCByZXNwb25zZSBmcm9tIEVuZG9yIExhYnMgQVBJOiBcXGAke2JvZHl9XFxgYCk7XG4gIH1cblxuICBpZiAoIWlzVmVyc2lvblJlc3BvbnNlKGRhdGEpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHJlc3BvbnNlIGZyb20gRW5kb3IgTGFicyBBUEk6IFxcYCR7Ym9keX1cXGBgKTtcbiAgfVxuXG4gIGlmICghZGF0YS5DbGllbnRWZXJzaW9uKSB7XG4gICAgZGF0YS5DbGllbnRWZXJzaW9uID0gZGF0YS5TZXJ2aWNlLlZlcnNpb247XG4gIH1cblxuICByZXR1cm4gZGF0YTtcbn07XG5cbi8qKlxuICogRG93bmxvYWRzIHRoZSBlbmRvcmN0bCBiaW5hcnkgYW5kIHJldHVybnMgdGhlIHBhdGggdG8gdGhlIGRvd25sb2FkZWQgYmluYXJ5XG4gKi9cbmV4cG9ydCBjb25zdCBzZXR1cEVuZG9yY3RsID0gYXN5bmMgKHtcbiAgdmVyc2lvbixcbiAgY2hlY2tzdW0sXG4gIGFwaSxcbn06IFNldHVwUHJvcHMpOiBQcm9taXNlPHN0cmluZz4gPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHBsYXRmb3JtID0gZ2V0UGxhdGZvcm1JbmZvKHRsLmdldFBsYXRmb3JtKCksIGFyY2goKSk7XG4gICAgY29uc3QgaXNXaW5kb3dzID0gcGxhdGZvcm0ub3MgPT09IFwid2luZG93c1wiO1xuXG4gICAgbGV0IGVuZG9yY3RsVmVyc2lvbiA9IHZlcnNpb247XG4gICAgbGV0IGVuZG9yY3RsQ2hlY2tzdW0gPSBjaGVja3N1bTtcbiAgICBpZiAoIXZlcnNpb24pIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhgRW5kb3JjdGwgdmVyc2lvbiBub3QgcHJvdmlkZWQsIHVzaW5nIGxhdGVzdCB2ZXJzaW9uYCk7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmZXRjaExhdGVzdEVuZG9yY3RsVmVyc2lvbihhcGkpO1xuICAgICAgZW5kb3JjdGxWZXJzaW9uID0gZGF0YS5DbGllbnRWZXJzaW9uO1xuICAgICAgZW5kb3JjdGxDaGVja3N1bSA9IGdldEVuZG9yY3RsQ2hlY2tzdW0oXG4gICAgICAgIGRhdGEuQ2xpZW50Q2hlY2tzdW1zLFxuICAgICAgICBwbGF0Zm9ybS5vcyxcbiAgICAgICAgcGxhdGZvcm0uYXJjaFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zb2xlLmluZm8oYERvd25sb2FkaW5nIGVuZG9yY3RsIHZlcnNpb24gJHtlbmRvcmN0bFZlcnNpb259YCk7XG4gICAgY29uc3QgdXJsID0gYCR7YXBpfS9kb3dubG9hZC9lbmRvcmxhYnMvJHtlbmRvcmN0bFZlcnNpb259L2JpbmFyaWVzL2VuZG9yY3RsXyR7ZW5kb3JjdGxWZXJzaW9ufV8ke1xuICAgICAgcGxhdGZvcm0ub3NcbiAgICB9XyR7cGxhdGZvcm0uYXJjaH0ke2lzV2luZG93cyA/IFwiLmV4ZVwiIDogXCJcIn1gO1xuICAgIGNvbnN0IGJpbmFyeU5hbWUgPSBgZW5kb3JjdGwke2lzV2luZG93cyA/IFwiLmV4ZVwiIDogXCJcIn1gO1xuXG4gICAgbGV0IGVuZG9yY3RsRGlyOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgZW5kb3JjdGxEaXIgPSB0bC5nZXRWYXJpYWJsZShcIkFnZW50LlRlbXBEaXJlY3RvcnlcIik7XG4gICAgaWYgKCFlbmRvcmN0bERpcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQWdlbnQuVGVtcERpcmVjdG9yeSBpcyBub3Qgc2V0XCIpOyAvLyBzZXQgYnkgQXp1cmUgUGlwZWxpbmVzIGVudmlyb25tZW50XG4gICAgfVxuXG4gICAgYXdhaXQgZG93bmxvYWRFeGVjdXRhYmxlKGVuZG9yY3RsRGlyLCB7XG4gICAgICBmaWxlbmFtZTogYmluYXJ5TmFtZSxcbiAgICAgIGRvd25sb2FkVXJsOiB1cmwsXG4gICAgfSk7XG5cbiAgICBjb25zdCBoYXNoID0gYXdhaXQgY3JlYXRlSGFzaEZyb21GaWxlKHBhdGguam9pbihlbmRvcmN0bERpciwgYmluYXJ5TmFtZSkpO1xuICAgIGlmIChoYXNoICE9PSBlbmRvcmN0bENoZWNrc3VtKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiVGhlIGNoZWNrc3VtIG9mIHRoZSBkb3dubG9hZGVkIGJpbmFyeSBkb2VzIG5vdCBtYXRjaCB0aGUgZXhwZWN0ZWQgdmFsdWUhXCJcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUuaW5mbyhgQmluYXJ5IGNoZWNrc3VtOiAke2VuZG9yY3RsQ2hlY2tzdW19YCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5pbmZvKGBFbmRvcmN0bCBkb3dubG9hZGVkIGF0ICR7ZW5kb3JjdGxEaXJ9YCk7XG4gICAgcmV0dXJuIGAke2VuZG9yY3RsRGlyfSR7cGF0aC5zZXB9ZW5kb3JjdGwke2lzV2luZG93cyA/IFwiLmV4ZVwiIDogXCJcIn1gO1xuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5sb2coXCJmYWlsZWQgdG8gZG93bmxvYWQgZW5kb3JjdGwuXCIpO1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfVxuXG4gIHJldHVybiBcIlwiO1xufTtcblxuLyoqXG4gKiBEb3dubG9hZHMgdGhlIGV4ZWN1dGFibGUgZnJvbSB0aGUgZ2l2ZW4gVVJMIHRvIHRoZSB0YXJnZXQgZGlyZWN0b3J5XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZEV4ZWN1dGFibGUoXG4gIHRhcmdldERpcmVjdG9yeTogc3RyaW5nLFxuICBleGVjdXRhYmxlOiBFeGVjdXRhYmxlLFxuICBtYXhSZXRyaWVzID0gM1xuKSB7XG4gIGNvbnN0IGZpbGVQYXRoID0gcGF0aC5qb2luKHRhcmdldERpcmVjdG9yeSwgZXhlY3V0YWJsZS5maWxlbmFtZSk7XG4gIGNvbnNvbGUubG9nKGBEb3dubG9hZGluZyBleGVjdXRhYmxlIHRvOiAke2ZpbGVQYXRofWApO1xuXG4gIC8vIENoZWNrIGlmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzXG4gIGlmIChmcy5leGlzdHNTeW5jKGZpbGVQYXRoKSkge1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYEZpbGUgJHtleGVjdXRhYmxlLmZpbGVuYW1lfSBhbHJlYWR5IGV4aXN0cywgc2tpcHBpbmcgZG93bmxvYWQuYFxuICAgICk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZmlsZVdyaXRlciA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVQYXRoLCB7XG4gICAgbW9kZTogMG83NjYsXG4gIH0pO1xuXG4gIC8vIFdyYXBwaW5nIHRoZSBkb3dubG9hZCBpbiBhIGZ1bmN0aW9uIGZvciBlYXN5IHJldHJ5aW5nXG4gIGNvbnN0IGRvRG93bmxvYWQgPSAodXJsU3RyaW5nOiBzdHJpbmcsIGZpbGVuYW1lOiBzdHJpbmcpID0+XG4gICAgbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh1cmxTdHJpbmcpO1xuICAgICAgY29uc3QgcmVxdWVzdE9wdHM6IGh0dHBzLlJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgICBob3N0OiB1cmwuaG9zdG5hbWUsXG4gICAgICAgIHBhdGg6IHVybC5wYXRobmFtZSxcbiAgICAgICAgdGltZW91dDogMzAwMDAwLCAvLyA1bWluc1xuICAgICAgfTtcbiAgICAgIGh0dHBzXG4gICAgICAgIC5nZXQocmVxdWVzdE9wdHMsIChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IGlzUmVzcG9uc2VFcnJvciA9IHJlc3BvbnNlLnN0YXR1c0NvZGUgIT09IDIwMDtcblxuICAgICAgICAgIHJlc3BvbnNlLm9uKFwiZmluaXNoXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBSZXNwb25zZSBmaW5pc2hlZCBmb3IgJHt1cmxTdHJpbmd9YCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzcG9uc2Uub24oXCJjbG9zZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgRG93bmxvYWQgY29ubmVjdGlvbiBjbG9zZWQgZm9yICR7dXJsU3RyaW5nfWApO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc3BvbnNlLm9uKFwiZXJyb3JcIiwgKGVycikgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRG93bmxvYWQgb2YgJHtmaWxlbmFtZX0gZmFpbGVkOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzQ29kZSAhPT0gMjAwKSB7XG4gICAgICAgICAgICBmaWxlV3JpdGVyLmNsb3NlKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZmlsZVdyaXRlci5vbihcImNsb3NlXCIsICgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBGaWxlLmNsb3NlICR7ZmlsZW5hbWV9IHNhdmVkIHRvICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgICAgICBpZiAoaXNSZXNwb25zZUVycm9yKSB7XG4gICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoYEhUVFAgJHtyZXNwb25zZS5zdGF0dXNDb2RlfWApKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJlc3BvbnNlLnBpcGUoZmlsZVdyaXRlcik7XG4gICAgICAgIH0pXG4gICAgICAgIC5vbihcInRpbWVvdXRcIiwgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYERvd25sb2FkIG9mICR7ZmlsZW5hbWV9IHRpbWVkIG91dGApO1xuICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICB9KVxuICAgICAgICAub24oXCJlcnJvclwiLCAoZXJyKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihgUmVxdWVzdCBmb3IgJHtmaWxlbmFtZX0gZmFpbGVkOiAke2Vyci5tZXNzYWdlfWApO1xuICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcblxuICAvLyBUcnkgdG8gZG93bmxvYWQgdGhlIGZpbGUsIHJldHJ5IHVwIHRvIGBtYXhSZXRyaWVzYCB0aW1lcyBpZiB0aGUgYXR0ZW1wdCBmYWlsc1xuICBmb3IgKGxldCBhdHRlbXB0ID0gMDsgYXR0ZW1wdCA8IG1heFJldHJpZXM7IGF0dGVtcHQrKykge1xuICAgIHRyeSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYERvd25sb2FkaW5nOiAke2V4ZWN1dGFibGUuZmlsZW5hbWV9IGZyb206ICR7ZXhlY3V0YWJsZS5kb3dubG9hZFVybH1gXG4gICAgICApO1xuICAgICAgYXdhaXQgZG9Eb3dubG9hZChleGVjdXRhYmxlLmRvd25sb2FkVXJsLCBleGVjdXRhYmxlLmZpbGVuYW1lKTtcbiAgICAgIGNvbnNvbGUubG9nKGBEb3dubG9hZCBzdWNjZXNzZnVsIGZvciAke2V4ZWN1dGFibGUuZmlsZW5hbWV9YCk7XG4gICAgICByZXR1cm47XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgIGBEb3dubG9hZCBvZiAke2V4ZWN1dGFibGUuZmlsZW5hbWV9IGZhaWxlZDogJHtlcnIubWVzc2FnZX1gXG4gICAgICApO1xuXG4gICAgICAvLyBEb24ndCB3YWl0IGJlZm9yZSByZXRyeWluZyB0aGUgbGFzdCBhdHRlbXB0XG4gICAgICBpZiAoYXR0ZW1wdCA8IG1heFJldHJpZXMgLSAxKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgIGBSZXRyeWluZyBkb3dubG9hZCBvZiAke2V4ZWN1dGFibGUuZmlsZW5hbWV9IGZyb20gJHtleGVjdXRhYmxlLmRvd25sb2FkVXJsfSBhZnRlciA1IHNlY29uZHMuLi5gXG4gICAgICAgICk7XG4gICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYEFsbCByZXRyaWVzIGZhaWxlZCBmb3IgJHtleGVjdXRhYmxlLmZpbGVuYW1lfSBmcm9tICR7ZXhlY3V0YWJsZS5kb3dubG9hZFVybH06ICR7ZXJyLm1lc3NhZ2V9YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gSFRUUFMgcmVxdWVzdCBhbmQgcmV0dXJuIHRoZSByZXNwb25zZSBib2R5XG4gKi9cbmFzeW5jIGZ1bmN0aW9uIG1ha2VIdHRwc0NhbGwodXJsOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGh0dHBzXG4gICAgICAuZ2V0KHVybCwgKHJlcykgPT4ge1xuICAgICAgICBsZXQgZGF0YTogc3RyaW5nID0gXCJcIjtcblxuICAgICAgICAvLyBIYW5kbGUgaW5jb21pbmcgZGF0YSBjaHVua3NcbiAgICAgICAgcmVzLm9uKFwiZGF0YVwiLCAoY2h1bmspID0+IHtcbiAgICAgICAgICBkYXRhICs9IGNodW5rO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBUaGUgd2hvbGUgcmVzcG9uc2UgaGFzIGJlZW4gcmVjZWl2ZWRcbiAgICAgICAgcmVzLm9uKFwiZW5kXCIsICgpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcGFyc2VkRGF0YSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIERhdGE6XCIsIHBhcnNlZERhdGEpO1xuICAgICAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgcmVqZWN0KGBFcnJvciBwYXJzaW5nIHJlc3BvbnNlOiAke2Vycm9yfWApO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLm9uKFwiZXJyb3JcIiwgKGVycm9yKSA9PiB7XG4gICAgICAgIHJlamVjdChgSFRUUFMgcmVxdWVzdCBmYWlsZWQ6ICR7ZXJyb3J9YCk7XG4gICAgICB9KTtcbiAgfSk7XG59XG4iXX0=