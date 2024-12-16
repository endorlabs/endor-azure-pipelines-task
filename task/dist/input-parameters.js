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
exports.InputParameters = exports.parseInputParams = void 0;
const tl = __importStar(require("azure-pipelines-task-lib/task"));
class InputParameters {
    // "Set to the Endor Labs API to use."
    endorAPI = "https://api.endorlabs.com";
    // "Set the secret corresponding to the API key used to authenticate with Endor Labs."
    apiSecret = undefined;
    // "Set the API key used to authenticate with Endor Labs".
    apiKey = undefined;
    // "Set to a version of endorctl to pin this specific version for use. Defaults to the latest version."
    endorctlVersion = undefined;
    // "Set to the checksum associated with a pinned version of endorctl."
    endorctlChecksum = undefined;
    // "Set the endorctl log level, see also `logVerbose`."
    logLevel = "info";
    // "Set to `true` to enable verbose logging."
    logVerbose = false;
    // "Set to the name of a file to save results to. File name will be in the `results` output item. Default just writes to STDOUT."
    outputFile = undefined;
    //  "Set to a location on your GitHub runner to output the findings in SARIF format."
    sarifFile = "scan_results.sarif";
    // "Set to the namespace of the project that you are working with."
    namespace = undefined;
    // "Use this to add custom arguments to the endorctl command."
    additionalParameters = "";
    /****
      scan options
    *****/
    //"Scan git commits and generate findings for all dependencies."
    scanDependencies = true;
    //"Scan a specified container image. The image must be set with `image` and a project can be defined with `projectName`."
    scanContainer = false;
    // "Specify a container image to scan."
    image = undefined;
    // "Specify a project name for a container image scan."
    projectName = undefined;
    // "Scan a specified artifact or a package. The path to an artifact must be set with `scanPath`."
    scanPackage = false;
    // "Set to the path to scan. Defaults to the current working directory."
    scanPath = undefined;
    //  "Scan source code repository for CI/CD tools."
    scanTools = false;
    //  "Scan source code repository and generate findings for secrets. See also `scanGitLogs`."
    scanSecrets = false;
    // "Perform a more complete and detailed scan of secrets in the repository history.
    // Must be used together with `scan_secrets`."
    scanGitLogs = false;
    // "Scan source code repository and generate findings for SAST."
    scanSast = false;
    // "Specify a list of user-defined tags to add to this scan. Tags can be used to search and filter scans later."
    tags = undefined;
    // "Enable phantom dependency analysis to identify dependencies used, but not declared in the manifest file."
    phantomDependencies = false;
    constructor() { }
    // validating input parameters provided by user.
    validate() {
        if (!this.namespace) {
            const errorMsg = "namespace is required and must be passed as an input value";
            throw new Error(errorMsg);
        }
        if (!(this.apiKey && this.apiSecret)) {
            const errorMsg = "apiKey and apiSecret are required field.";
            throw new Error(errorMsg);
        }
        if (!this.scanDependencies &&
            !this.scanSecrets &&
            !this.scanSast &&
            !this.scanContainer &&
            !this.scanTools &&
            !this.scanPackage) {
            const errorMsg = "At least one of `scanDependencies`, `scanSecrets`, `scanTools`, `scanSast`, `scanContainer` or `scanPackage` must be enabled";
            throw new Error(errorMsg);
        }
        if (this.scanContainer && this.scanDependencies) {
            const errorMsg = "Container scan and dependency scan cannot be set at the same time";
            throw new Error(errorMsg);
        }
        if (this.scanPackage) {
            if (this.scanContainer) {
                const errorMsg = "Package scan and Container scan cannot be set at the same time";
                throw new Error(errorMsg);
            }
            if (this.scanDependencies) {
                const errorMsg = "Package scan and Dependency scan cannot be set at the same time";
                throw new Error(errorMsg);
            }
            if (this.scanSecrets) {
                const errorMsg = "Package scan and Secrets scan cannot be set at the same time";
                throw new Error(errorMsg);
            }
            if (this.scanSast) {
                const errorMsg = "Package scan and SAST scan cannot be set at the same time";
                throw new Error(errorMsg);
            }
            if (!this.projectName) {
                const errorMsg = "Please provide project name via projectName parameter";
                throw new Error(errorMsg);
            }
            if (!this.scanPath) {
                const errorMsg = "Please provide path to the package to scan via scan_path parameter";
                throw new Error(errorMsg);
            }
        }
        if (this.scanGitLogs && !this.scanSecrets) {
            const errorMsg = "Please also enable `scan_secrets` to scan Git logs for secrets";
            throw new Error(errorMsg);
        }
        if (this.scanContainer && !this.image) {
            const errorMsg = "image is required to scan container and must be passed as an input from the workflow via an image parameter";
            throw new Error(errorMsg);
        }
    }
}
exports.InputParameters = InputParameters;
function parseInputParams() {
    const taskArgs = new InputParameters();
    const endorAPI = tl.getInput("endorAPI", false);
    if (endorAPI) {
        taskArgs.endorAPI = endorAPI;
    }
    const apiKey = tl.getInput("apiKey", false);
    if (apiKey) {
        taskArgs.apiKey = apiKey;
    }
    const apiSecret = tl.getInput("apiSecret", false);
    if (apiSecret) {
        taskArgs.apiSecret = apiSecret;
    }
    const endorctlVersion = tl.getInput("endorctlVersion", false);
    if (endorctlVersion) {
        taskArgs.endorctlVersion = endorctlVersion;
    }
    const endorctlChecksum = tl.getInput("endorctlChecksum", false);
    if (endorctlChecksum) {
        taskArgs.endorctlChecksum = endorctlChecksum;
    }
    const namespace = tl.getInput("namespace", true);
    if (namespace) {
        taskArgs.namespace = namespace;
    }
    const logLevel = tl.getInput("logLevel", false);
    if (logLevel) {
        taskArgs.logLevel = logLevel;
    }
    const logVerbose = tl.getBoolInput("logVerbose", false);
    if (logVerbose) {
        taskArgs.logVerbose = logVerbose;
    }
    const outputFile = tl.getInput("outputFile", false);
    if (outputFile) {
        taskArgs.outputFile = outputFile;
    }
    const sarifFile = tl.getInput("sarifFile", false);
    if (sarifFile) {
        taskArgs.sarifFile = sarifFile;
    }
    const additionalArguments = tl.getInput("additionalArguments", false);
    if (additionalArguments) {
        taskArgs.additionalParameters = additionalArguments;
    }
    // this needs to be parsed as string because the default value is "true" and
    // tl.getBoolInput will return false if the input is not set.
    const scanDependencies = tl.getInput("scanDependencies", false);
    if (scanDependencies && scanDependencies.toLowerCase() == "false") {
        taskArgs.scanDependencies = false;
    }
    const scanContainer = tl.getBoolInput("scanContainer", false);
    if (scanContainer) {
        taskArgs.scanContainer = scanContainer;
    }
    const image = tl.getInput("image", false);
    if (image) {
        taskArgs.image = image;
    }
    const projectName = tl.getInput("projectName", false);
    if (projectName) {
        taskArgs.projectName = projectName;
    }
    const scanPackage = tl.getBoolInput("scanPackage", false);
    if (scanPackage) {
        taskArgs.scanPackage = scanPackage;
    }
    const scanPath = tl.getInput("scanPath", false);
    if (scanPath) {
        taskArgs.scanPath = scanPath;
    }
    const scanTools = tl.getBoolInput("scanTools", false);
    if (scanTools) {
        taskArgs.scanTools = scanTools;
    }
    const scanSecrets = tl.getBoolInput("scanSecrets", false);
    if (scanSecrets) {
        taskArgs.scanSecrets = scanSecrets;
    }
    const scanGitLogs = tl.getBoolInput("scanGitLogs", false);
    if (scanGitLogs) {
        taskArgs.scanGitLogs = scanGitLogs;
    }
    const scanSast = tl.getBoolInput("scanSast", false);
    if (scanGitLogs) {
        taskArgs.scanSast = scanSast;
    }
    const tags = tl.getInput("tags", false);
    if (tags) {
        taskArgs.tags = tags;
    }
    const phantomDependencies = tl.getBoolInput("phantomDependencies", false);
    if (phantomDependencies) {
        taskArgs.phantomDependencies = phantomDependencies;
    }
    return taskArgs;
}
exports.parseInputParams = parseInputParams;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtcGFyYW1ldGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnB1dC1wYXJhbWV0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQW9EO0FBRXBELE1BQU0sZUFBZTtJQUNuQixzQ0FBc0M7SUFDdEMsUUFBUSxHQUFXLDJCQUEyQixDQUFDO0lBRS9DLHNGQUFzRjtJQUN0RixTQUFTLEdBQXVCLFNBQVMsQ0FBQztJQUUxQywwREFBMEQ7SUFDMUQsTUFBTSxHQUF1QixTQUFTLENBQUM7SUFFdkMsdUdBQXVHO0lBQ3ZHLGVBQWUsR0FBdUIsU0FBUyxDQUFDO0lBRWhELHNFQUFzRTtJQUN0RSxnQkFBZ0IsR0FBdUIsU0FBUyxDQUFDO0lBRWpELHVEQUF1RDtJQUN2RCxRQUFRLEdBQXVCLE1BQU0sQ0FBQztJQUV0Qyw2Q0FBNkM7SUFDN0MsVUFBVSxHQUF3QixLQUFLLENBQUM7SUFFeEMsaUlBQWlJO0lBQ2pJLFVBQVUsR0FBdUIsU0FBUyxDQUFDO0lBRTNDLHFGQUFxRjtJQUNyRixTQUFTLEdBQXVCLG9CQUFvQixDQUFDO0lBRXJELG1FQUFtRTtJQUNuRSxTQUFTLEdBQXVCLFNBQVMsQ0FBQztJQUUxQyw4REFBOEQ7SUFDOUQsb0JBQW9CLEdBQXVCLEVBQUUsQ0FBQztJQUU5Qzs7VUFFTTtJQUNOLGdFQUFnRTtJQUNoRSxnQkFBZ0IsR0FBWSxJQUFJLENBQUM7SUFFakMseUhBQXlIO0lBQ3pILGFBQWEsR0FBWSxLQUFLLENBQUM7SUFFL0IsdUNBQXVDO0lBQ3ZDLEtBQUssR0FBdUIsU0FBUyxDQUFDO0lBRXRDLHVEQUF1RDtJQUN2RCxXQUFXLEdBQXVCLFNBQVMsQ0FBQztJQUU1QyxpR0FBaUc7SUFDakcsV0FBVyxHQUFZLEtBQUssQ0FBQztJQUU3Qix3RUFBd0U7SUFDeEUsUUFBUSxHQUF1QixTQUFTLENBQUM7SUFFekMsa0RBQWtEO0lBQ2xELFNBQVMsR0FB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TSxXQUFXLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUQsSUFBSSxXQUFXLEVBQUU7UUFDZixRQUFRLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztLQUNwQztJQUVELE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3BELElBQUksV0FBVyxFQUFFO1FBQ2YsUUFBUSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7S0FDOUI7SUFFRCxNQUFNLElBQUksR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN4QyxJQUFJLElBQUksRUFBRTtRQUNSLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0tBQ3RCO0lBRUQsTUFBTSxtQkFBbUIsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFFLElBQUksbUJBQW1CLEVBQUU7UUFDdkIsUUFBUSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO0tBQ3BEO0lBRUQsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQXpIRCw0Q0F5SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyB0bCBmcm9tIFwiYXp1cmUtcGlwZWxpbmVzLXRhc2stbGliL3Rhc2tcIjtcblxuY2xhc3MgSW5wdXRQYXJhbWV0ZXJzIHtcbiAgLy8gXCJTZXQgdG8gdGhlIEVuZG9yIExhYnMgQVBJIHRvIHVzZS5cIlxuICBlbmRvckFQSTogc3RyaW5nID0gXCJodHRwczovL2FwaS5lbmRvcmxhYnMuY29tXCI7XG5cbiAgLy8gXCJTZXQgdGhlIHNlY3JldCBjb3JyZXNwb25kaW5nIHRvIHRoZSBBUEkga2V5IHVzZWQgdG8gYXV0aGVudGljYXRlIHdpdGggRW5kb3IgTGFicy5cIlxuICBhcGlTZWNyZXQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvLyBcIlNldCB0aGUgQVBJIGtleSB1c2VkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIEVuZG9yIExhYnNcIi5cbiAgYXBpS2V5OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gXCJTZXQgdG8gYSB2ZXJzaW9uIG9mIGVuZG9yY3RsIHRvIHBpbiB0aGlzIHNwZWNpZmljIHZlcnNpb24gZm9yIHVzZS4gRGVmYXVsdHMgdG8gdGhlIGxhdGVzdCB2ZXJzaW9uLlwiXG4gIGVuZG9yY3RsVmVyc2lvbjogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiU2V0IHRvIHRoZSBjaGVja3N1bSBhc3NvY2lhdGVkIHdpdGggYSBwaW5uZWQgdmVyc2lvbiBvZiBlbmRvcmN0bC5cIlxuICBlbmRvcmN0bENoZWNrc3VtOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gXCJTZXQgdGhlIGVuZG9yY3RsIGxvZyBsZXZlbCwgc2VlIGFsc28gYGxvZ1ZlcmJvc2VgLlwiXG4gIGxvZ0xldmVsOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcImluZm9cIjtcblxuICAvLyBcIlNldCB0byBgdHJ1ZWAgdG8gZW5hYmxlIHZlcmJvc2UgbG9nZ2luZy5cIlxuICBsb2dWZXJib3NlOiBib29sZWFuIHwgdW5kZWZpbmVkID0gZmFsc2U7XG5cbiAgLy8gXCJTZXQgdG8gdGhlIG5hbWUgb2YgYSBmaWxlIHRvIHNhdmUgcmVzdWx0cyB0by4gRmlsZSBuYW1lIHdpbGwgYmUgaW4gdGhlIGByZXN1bHRzYCBvdXRwdXQgaXRlbS4gRGVmYXVsdCBqdXN0IHdyaXRlcyB0byBTVERPVVQuXCJcbiAgb3V0cHV0RmlsZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vICBcIlNldCB0byBhIGxvY2F0aW9uIG9uIHlvdXIgR2l0SHViIHJ1bm5lciB0byBvdXRwdXQgdGhlIGZpbmRpbmdzIGluIFNBUklGIGZvcm1hdC5cIlxuICBzYXJpZkZpbGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IFwic2Nhbl9yZXN1bHRzLnNhcmlmXCI7XG5cbiAgLy8gXCJTZXQgdG8gdGhlIG5hbWVzcGFjZSBvZiB0aGUgcHJvamVjdCB0aGF0IHlvdSBhcmUgd29ya2luZyB3aXRoLlwiXG4gIG5hbWVzcGFjZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiVXNlIHRoaXMgdG8gYWRkIGN1c3RvbSBhcmd1bWVudHMgdG8gdGhlIGVuZG9yY3RsIGNvbW1hbmQuXCJcbiAgYWRkaXRpb25hbFBhcmFtZXRlcnM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IFwiXCI7XG5cbiAgLyoqKiogIFxuICAgIHNjYW4gb3B0aW9ucyBcbiAgKioqKiovXG4gIC8vXCJTY2FuIGdpdCBjb21taXRzIGFuZCBnZW5lcmF0ZSBmaW5kaW5ncyBmb3IgYWxsIGRlcGVuZGVuY2llcy5cIlxuICBzY2FuRGVwZW5kZW5jaWVzOiBib29sZWFuID0gdHJ1ZTtcblxuICAvL1wiU2NhbiBhIHNwZWNpZmllZCBjb250YWluZXIgaW1hZ2UuIFRoZSBpbWFnZSBtdXN0IGJlIHNldCB3aXRoIGBpbWFnZWAgYW5kIGEgcHJvamVjdCBjYW4gYmUgZGVmaW5lZCB3aXRoIGBwcm9qZWN0TmFtZWAuXCJcbiAgc2NhbkNvbnRhaW5lcjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8vIFwiU3BlY2lmeSBhIGNvbnRhaW5lciBpbWFnZSB0byBzY2FuLlwiXG4gIGltYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gXCJTcGVjaWZ5IGEgcHJvamVjdCBuYW1lIGZvciBhIGNvbnRhaW5lciBpbWFnZSBzY2FuLlwiXG4gIHByb2plY3ROYW1lOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gXCJTY2FuIGEgc3BlY2lmaWVkIGFydGlmYWN0IG9yIGEgcGFja2FnZS4gVGhlIHBhdGggdG8gYW4gYXJ0aWZhY3QgbXVzdCBiZSBzZXQgd2l0aCBgc2NhblBhdGhgLlwiXG4gIHNjYW5QYWNrYWdlOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLy8gXCJTZXQgdG8gdGhlIHBhdGggdG8gc2Nhbi4gRGVmYXVsdHMgdG8gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXCJcbiAgc2NhblBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvLyAgXCJTY2FuIHNvdXJjZSBjb2RlIHJlcG9zaXRvcnkgZm9yIENJL0NEIHRvb2xzLlwiXG4gIHNjYW5Ub29sczogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8vICBcIlNjYW4gc291cmNlIGNvZGUgcmVwb3NpdG9yeSBhbmQgZ2VuZXJhdGUgZmluZGluZ3MgZm9yIHNlY3JldHMuIFNlZSBhbHNvIGBzY2FuR2l0TG9nc2AuXCJcbiAgc2NhblNlY3JldHM6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBcIlBlcmZvcm0gYSBtb3JlIGNvbXBsZXRlIGFuZCBkZXRhaWxlZCBzY2FuIG9mIHNlY3JldHMgaW4gdGhlIHJlcG9zaXRvcnkgaGlzdG9yeS5cbiAgLy8gTXVzdCBiZSB1c2VkIHRvZ2V0aGVyIHdpdGggYHNjYW5fc2VjcmV0c2AuXCJcbiAgc2NhbkdpdExvZ3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBcIlNjYW4gc291cmNlIGNvZGUgcmVwb3NpdG9yeSBhbmQgZ2VuZXJhdGUgZmluZGluZ3MgZm9yIFNBU1QuXCJcbiAgc2NhblNhc3Q6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBcIlNwZWNpZnkgYSBsaXN0IG9mIHVzZXItZGVmaW5lZCB0YWdzIHRvIGFkZCB0byB0aGlzIHNjYW4uIFRhZ3MgY2FuIGJlIHVzZWQgdG8gc2VhcmNoIGFuZCBmaWx0ZXIgc2NhbnMgbGF0ZXIuXCJcbiAgdGFnczogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiRW5hYmxlIHBoYW50b20gZGVwZW5kZW5jeSBhbmFseXNpcyB0byBpZGVudGlmeSBkZXBlbmRlbmNpZXMgdXNlZCwgYnV0IG5vdCBkZWNsYXJlZCBpbiB0aGUgbWFuaWZlc3QgZmlsZS5cIlxuICBwaGFudG9tRGVwZW5kZW5jaWVzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8vIHZhbGlkYXRpbmcgaW5wdXQgcGFyYW1ldGVycyBwcm92aWRlZCBieSB1c2VyLlxuICBwdWJsaWMgdmFsaWRhdGUoKSB7XG4gICAgaWYgKCF0aGlzLm5hbWVzcGFjZSkge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICBcIm5hbWVzcGFjZSBpcyByZXF1aXJlZCBhbmQgbXVzdCBiZSBwYXNzZWQgYXMgYW4gaW5wdXQgdmFsdWVcIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgfVxuXG4gICAgaWYgKCEodGhpcy5hcGlLZXkgJiYgdGhpcy5hcGlTZWNyZXQpKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9IFwiYXBpS2V5IGFuZCBhcGlTZWNyZXQgYXJlIHJlcXVpcmVkIGZpZWxkLlwiO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdGhpcy5zY2FuRGVwZW5kZW5jaWVzICYmXG4gICAgICAhdGhpcy5zY2FuU2VjcmV0cyAmJlxuICAgICAgIXRoaXMuc2NhblNhc3QgJiZcbiAgICAgICF0aGlzLnNjYW5Db250YWluZXIgJiZcbiAgICAgICF0aGlzLnNjYW5Ub29scyAmJlxuICAgICAgIXRoaXMuc2NhblBhY2thZ2VcbiAgICApIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgXCJBdCBsZWFzdCBvbmUgb2YgYHNjYW5EZXBlbmRlbmNpZXNgLCBgc2NhblNlY3JldHNgLCBgc2NhblRvb2xzYCwgYHNjYW5TYXN0YCwgYHNjYW5Db250YWluZXJgIG9yIGBzY2FuUGFja2FnZWAgbXVzdCBiZSBlbmFibGVkXCI7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnNjYW5Db250YWluZXIgJiYgdGhpcy5zY2FuRGVwZW5kZW5jaWVzKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgIFwiQ29udGFpbmVyIHNjYW4gYW5kIGRlcGVuZGVuY3kgc2NhbiBjYW5ub3QgYmUgc2V0IGF0IHRoZSBzYW1lIHRpbWVcIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2NhblBhY2thZ2UpIHtcbiAgICAgIGlmICh0aGlzLnNjYW5Db250YWluZXIpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgIFwiUGFja2FnZSBzY2FuIGFuZCBDb250YWluZXIgc2NhbiBjYW5ub3QgYmUgc2V0IGF0IHRoZSBzYW1lIHRpbWVcIjtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNjYW5EZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgIFwiUGFja2FnZSBzY2FuIGFuZCBEZXBlbmRlbmN5IHNjYW4gY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5zY2FuU2VjcmV0cykge1xuICAgICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgICAgXCJQYWNrYWdlIHNjYW4gYW5kIFNlY3JldHMgc2NhbiBjYW5ub3QgYmUgc2V0IGF0IHRoZSBzYW1lIHRpbWVcIjtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNjYW5TYXN0KSB7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgICBcIlBhY2thZ2Ugc2NhbiBhbmQgU0FTVCBzY2FuIGNhbm5vdCBiZSBzZXQgYXQgdGhlIHNhbWUgdGltZVwiO1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLnByb2plY3ROYW1lKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgICBcIlBsZWFzZSBwcm92aWRlIHByb2plY3QgbmFtZSB2aWEgcHJvamVjdE5hbWUgcGFyYW1ldGVyXCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMuc2NhblBhdGgpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgIFwiUGxlYXNlIHByb3ZpZGUgcGF0aCB0byB0aGUgcGFja2FnZSB0byBzY2FuIHZpYSBzY2FuX3BhdGggcGFyYW1ldGVyXCI7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2NhbkdpdExvZ3MgJiYgIXRoaXMuc2NhblNlY3JldHMpIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgXCJQbGVhc2UgYWxzbyBlbmFibGUgYHNjYW5fc2VjcmV0c2AgdG8gc2NhbiBHaXQgbG9ncyBmb3Igc2VjcmV0c1wiO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zY2FuQ29udGFpbmVyICYmICF0aGlzLmltYWdlKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgIFwiaW1hZ2UgaXMgcmVxdWlyZWQgdG8gc2NhbiBjb250YWluZXIgYW5kIG11c3QgYmUgcGFzc2VkIGFzIGFuIGlucHV0IGZyb20gdGhlIHdvcmtmbG93IHZpYSBhbiBpbWFnZSBwYXJhbWV0ZXJcIjtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUlucHV0UGFyYW1zKCk6IElucHV0UGFyYW1ldGVycyB7XG4gIGNvbnN0IHRhc2tBcmdzOiBJbnB1dFBhcmFtZXRlcnMgPSBuZXcgSW5wdXRQYXJhbWV0ZXJzKCk7XG5cbiAgY29uc3QgZW5kb3JBUEkgPSB0bC5nZXRJbnB1dChcImVuZG9yQVBJXCIsIGZhbHNlKTtcbiAgaWYgKGVuZG9yQVBJKSB7XG4gICAgdGFza0FyZ3MuZW5kb3JBUEkgPSBlbmRvckFQSTtcbiAgfVxuXG4gIGNvbnN0IGFwaUtleSA9IHRsLmdldElucHV0KFwiYXBpS2V5XCIsIGZhbHNlKTtcbiAgaWYgKGFwaUtleSkge1xuICAgIHRhc2tBcmdzLmFwaUtleSA9IGFwaUtleTtcbiAgfVxuXG4gIGNvbnN0IGFwaVNlY3JldCA9IHRsLmdldElucHV0KFwiYXBpU2VjcmV0XCIsIGZhbHNlKTtcbiAgaWYgKGFwaVNlY3JldCkge1xuICAgIHRhc2tBcmdzLmFwaVNlY3JldCA9IGFwaVNlY3JldDtcbiAgfVxuXG4gIGNvbnN0IGVuZG9yY3RsVmVyc2lvbiA9IHRsLmdldElucHV0KFwiZW5kb3JjdGxWZXJzaW9uXCIsIGZhbHNlKTtcbiAgaWYgKGVuZG9yY3RsVmVyc2lvbikge1xuICAgIHRhc2tBcmdzLmVuZG9yY3RsVmVyc2lvbiA9IGVuZG9yY3RsVmVyc2lvbjtcbiAgfVxuXG4gIGNvbnN0IGVuZG9yY3RsQ2hlY2tzdW0gPSB0bC5nZXRJbnB1dChcImVuZG9yY3RsQ2hlY2tzdW1cIiwgZmFsc2UpO1xuICBpZiAoZW5kb3JjdGxDaGVja3N1bSkge1xuICAgIHRhc2tBcmdzLmVuZG9yY3RsQ2hlY2tzdW0gPSBlbmRvcmN0bENoZWNrc3VtO1xuICB9XG5cbiAgY29uc3QgbmFtZXNwYWNlID0gdGwuZ2V0SW5wdXQoXCJuYW1lc3BhY2VcIiwgdHJ1ZSk7XG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICB0YXNrQXJncy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIH1cblxuICBjb25zdCBsb2dMZXZlbCA9IHRsLmdldElucHV0KFwibG9nTGV2ZWxcIiwgZmFsc2UpO1xuICBpZiAobG9nTGV2ZWwpIHtcbiAgICB0YXNrQXJncy5sb2dMZXZlbCA9IGxvZ0xldmVsO1xuICB9XG5cbiAgY29uc3QgbG9nVmVyYm9zZSA9IHRsLmdldEJvb2xJbnB1dChcImxvZ1ZlcmJvc2VcIiwgZmFsc2UpO1xuICBpZiAobG9nVmVyYm9zZSkge1xuICAgIHRhc2tBcmdzLmxvZ1ZlcmJvc2UgPSBsb2dWZXJib3NlO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0RmlsZSA9IHRsLmdldElucHV0KFwib3V0cHV0RmlsZVwiLCBmYWxzZSk7XG4gIGlmIChvdXRwdXRGaWxlKSB7XG4gICAgdGFza0FyZ3Mub3V0cHV0RmlsZSA9IG91dHB1dEZpbGU7XG4gIH1cblxuICBjb25zdCBzYXJpZkZpbGUgPSB0bC5nZXRJbnB1dChcInNhcmlmRmlsZVwiLCBmYWxzZSk7XG4gIGlmIChzYXJpZkZpbGUpIHtcbiAgICB0YXNrQXJncy5zYXJpZkZpbGUgPSBzYXJpZkZpbGU7XG4gIH1cblxuICBjb25zdCBhZGRpdGlvbmFsQXJndW1lbnRzID0gdGwuZ2V0SW5wdXQoXCJhZGRpdGlvbmFsQXJndW1lbnRzXCIsIGZhbHNlKTtcbiAgaWYgKGFkZGl0aW9uYWxBcmd1bWVudHMpIHtcbiAgICB0YXNrQXJncy5hZGRpdGlvbmFsUGFyYW1ldGVycyA9IGFkZGl0aW9uYWxBcmd1bWVudHM7XG4gIH1cblxuICAvLyB0aGlzIG5lZWRzIHRvIGJlIHBhcnNlZCBhcyBzdHJpbmcgYmVjYXVzZSB0aGUgZGVmYXVsdCB2YWx1ZSBpcyBcInRydWVcIiBhbmRcbiAgLy8gdGwuZ2V0Qm9vbElucHV0IHdpbGwgcmV0dXJuIGZhbHNlIGlmIHRoZSBpbnB1dCBpcyBub3Qgc2V0LlxuICBjb25zdCBzY2FuRGVwZW5kZW5jaWVzID0gdGwuZ2V0SW5wdXQoXCJzY2FuRGVwZW5kZW5jaWVzXCIsIGZhbHNlKTtcbiAgaWYgKHNjYW5EZXBlbmRlbmNpZXMgJiYgc2NhbkRlcGVuZGVuY2llcy50b0xvd2VyQ2FzZSgpID09IFwiZmFsc2VcIikge1xuICAgIHRhc2tBcmdzLnNjYW5EZXBlbmRlbmNpZXMgPSBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHNjYW5Db250YWluZXIgPSB0bC5nZXRCb29sSW5wdXQoXCJzY2FuQ29udGFpbmVyXCIsIGZhbHNlKTtcbiAgaWYgKHNjYW5Db250YWluZXIpIHtcbiAgICB0YXNrQXJncy5zY2FuQ29udGFpbmVyID0gc2NhbkNvbnRhaW5lcjtcbiAgfVxuXG4gIGNvbnN0IGltYWdlID0gdGwuZ2V0SW5wdXQoXCJpbWFnZVwiLCBmYWxzZSk7XG4gIGlmIChpbWFnZSkge1xuICAgIHRhc2tBcmdzLmltYWdlID0gaW1hZ2U7XG4gIH1cblxuICBjb25zdCBwcm9qZWN0TmFtZSA9IHRsLmdldElucHV0KFwicHJvamVjdE5hbWVcIiwgZmFsc2UpO1xuICBpZiAocHJvamVjdE5hbWUpIHtcbiAgICB0YXNrQXJncy5wcm9qZWN0TmFtZSA9IHByb2plY3ROYW1lO1xuICB9XG5cbiAgY29uc3Qgc2NhblBhY2thZ2UgPSB0bC5nZXRCb29sSW5wdXQoXCJzY2FuUGFja2FnZVwiLCBmYWxzZSk7XG4gIGlmIChzY2FuUGFja2FnZSkge1xuICAgIHRhc2tBcmdzLnNjYW5QYWNrYWdlID0gc2NhblBhY2thZ2U7XG4gIH1cblxuICBjb25zdCBzY2FuUGF0aCA9IHRsLmdldElucHV0KFwic2NhblBhdGhcIiwgZmFsc2UpO1xuICBpZiAoc2NhblBhdGgpIHtcbiAgICB0YXNrQXJncy5zY2FuUGF0aCA9IHNjYW5QYXRoO1xuICB9XG5cbiAgY29uc3Qgc2NhblRvb2xzID0gdGwuZ2V0Qm9vbElucHV0KFwic2NhblRvb2xzXCIsIGZhbHNlKTtcbiAgaWYgKHNjYW5Ub29scykge1xuICAgIHRhc2tBcmdzLnNjYW5Ub29scyA9IHNjYW5Ub29scztcbiAgfVxuXG4gIGNvbnN0IHNjYW5TZWNyZXRzID0gdGwuZ2V0Qm9vbElucHV0KFwic2NhblNlY3JldHNcIiwgZmFsc2UpO1xuICBpZiAoc2NhblNlY3JldHMpIHtcbiAgICB0YXNrQXJncy5zY2FuU2VjcmV0cyA9IHNjYW5TZWNyZXRzO1xuICB9XG5cbiAgY29uc3Qgc2NhbkdpdExvZ3MgPSB0bC5nZXRCb29sSW5wdXQoXCJzY2FuR2l0TG9nc1wiLCBmYWxzZSk7XG4gIGlmIChzY2FuR2l0TG9ncykge1xuICAgIHRhc2tBcmdzLnNjYW5HaXRMb2dzID0gc2NhbkdpdExvZ3M7XG4gIH1cblxuICBjb25zdCBzY2FuU2FzdCA9IHRsLmdldEJvb2xJbnB1dChcInNjYW5TYXN0XCIsIGZhbHNlKTtcbiAgaWYgKHNjYW5HaXRMb2dzKSB7XG4gICAgdGFza0FyZ3Muc2NhblNhc3QgPSBzY2FuU2FzdDtcbiAgfVxuXG4gIGNvbnN0IHRhZ3MgPSB0bC5nZXRJbnB1dChcInRhZ3NcIiwgZmFsc2UpO1xuICBpZiAodGFncykge1xuICAgIHRhc2tBcmdzLnRhZ3MgPSB0YWdzO1xuICB9XG5cbiAgY29uc3QgcGhhbnRvbURlcGVuZGVuY2llcyA9IHRsLmdldEJvb2xJbnB1dChcInBoYW50b21EZXBlbmRlbmNpZXNcIiwgZmFsc2UpO1xuICBpZiAocGhhbnRvbURlcGVuZGVuY2llcykge1xuICAgIHRhc2tBcmdzLnBoYW50b21EZXBlbmRlbmNpZXMgPSBwaGFudG9tRGVwZW5kZW5jaWVzO1xuICB9XG5cbiAgcmV0dXJuIHRhc2tBcmdzO1xufVxuXG5leHBvcnQgeyBJbnB1dFBhcmFtZXRlcnMgfTtcbiJdfQ==