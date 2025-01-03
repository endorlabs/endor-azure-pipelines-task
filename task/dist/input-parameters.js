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
    // Must be used together with `scanSecrets`."
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
            return new Error(errorMsg);
        }
        if (!(this.apiKey && this.apiSecret)) {
            const errorMsg = "apiKey and apiSecret are required field.";
            return new Error(errorMsg);
        }
        if (!this.scanDependencies &&
            !this.scanSecrets &&
            !this.scanSast &&
            !this.scanContainer &&
            !this.scanTools &&
            !this.scanPackage) {
            const errorMsg = "At least one of `scanDependencies`, `scanSecrets`, `scanTools`, `scanSast`, `scanContainer` or `scanPackage` must be enabled";
            return new Error(errorMsg);
        }
        if (this.scanContainer && this.scanDependencies) {
            const errorMsg = "Container scan and dependency scan cannot be set at the same time";
            return new Error(errorMsg);
        }
        if (this.scanPackage) {
            if (this.scanContainer) {
                const errorMsg = "Package scan and Container scan cannot be set at the same time";
                return new Error(errorMsg);
            }
            if (this.scanDependencies) {
                const errorMsg = "Package scan and Dependency scan cannot be set at the same time";
                return new Error(errorMsg);
            }
            if (this.scanSecrets) {
                const errorMsg = "Package scan and Secrets scan cannot be set at the same time";
                return new Error(errorMsg);
            }
            if (this.scanSast) {
                const errorMsg = "Package scan and SAST scan cannot be set at the same time";
                return new Error(errorMsg);
            }
            if (!this.projectName) {
                const errorMsg = "Please provide project name via projectName parameter";
                return new Error(errorMsg);
            }
            if (!this.scanPath) {
                const errorMsg = "Please provide path to the package to scan via scanPath parameter";
                return new Error(errorMsg);
            }
        }
        if (this.scanGitLogs && !this.scanSecrets) {
            const errorMsg = "Please also enable `scanSecrets` to scan Git logs for secrets";
            return new Error(errorMsg);
        }
        if (this.scanContainer && !this.image) {
            const errorMsg = "image is required to scan container and must be passed as an input from the workflow via an image parameter";
            return new Error(errorMsg);
        }
        return undefined;
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
    const additionalArguments = tl.getInput("additionalArgs", false);
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
    if (taskArgs.logLevel == "debug") {
        logInputParameters(taskArgs);
    }
    return taskArgs;
}
exports.parseInputParams = parseInputParams;
function logInputParameters(params) {
    console.log("Endor API is set to:", params.endorAPI);
    console.log("API Key:", params.apiKey?.length);
    console.log("API Secret:", params.apiSecret?.length);
    console.log("Endorctl Version:", params.endorctlVersion);
    console.log("Endorctl Checksum:", params.endorctlChecksum);
    console.log("Namespace is:", params.namespace);
    console.log("Log Level is:", params.logLevel);
    console.log("Log Verbose is:", params.logVerbose);
    console.log("Output File is:", params.outputFile);
    console.log("SARIF File is:", params.sarifFile);
    console.log("Additional Parameters are:", params.additionalParameters);
    console.log("Scan Dependencies is:", params.scanDependencies);
    console.log("Scan Container is:", params.scanContainer);
    console.log("Image is:", params.image);
    console.log("Project Name is:", params.projectName);
    console.log("Scan Package is:", params.scanPackage);
    console.log("Scan Path is:", params.scanPath);
    console.log("Scan Tools is:", params.scanTools);
    console.log("Scan Secrets is:", params.scanSecrets);
    console.log("Scan Git Logs is:", params.scanGitLogs);
    console.log("Scan SAST is:", params.scanSast);
    console.log("Tags are:", params.tags);
    console.log("Phantom Dependencies is:", params.phantomDependencies);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQtcGFyYW1ldGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbnB1dC1wYXJhbWV0ZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0VBQW9EO0FBRXBELE1BQU0sZUFBZTtJQUNuQixzQ0FBc0M7SUFDdEMsUUFBUSxHQUFXLDJCQUEyQixDQUFDO0lBRS9DLHNGQUFzRjtJQUN0RixTQUFTLEdBQXVCLFNBQVMsQ0FBQztJQUUxQywwREFBMEQ7SUFDMUQsTUFBTSxHQUF1QixTQUFTLENBQUM7SUFFdkMsdUdBQXVHO0lBQ3ZHLGVBQWUsR0FBdUIsU0FBUyxDQUFDO0lBRWhELHNFQUFzRTtJQUN0RSxnQkFBZ0IsR0FBdUIsU0FBUyxDQUFDO0lBRWpELHVEQUF1RDtJQUN2RCxRQUFRLEdBQXVCLE1BQU0sQ0FBQztJQUV0Qyw2Q0FBNkM7SUFDN0MsVUFBVSxHQUF3QixLQUFLLENBQUM7SUFFeEMsaUlBQWlJO0lBQ2pJLFVBQVUsR0FBdUIsU0FBUyxDQUFDO0lBRTNDLHFGQUFxRjtJQUNyRixTQUFTLEdBQXVCLG9CQUFvQixDQUFDO0lBRXJELG1FQUFtRTtJQUNuRSxTQUFTLEdBQXVCLFNBQVMsQ0FBQztJQUUxQyw4REFBOEQ7SUFDOUQsb0JBQW9CLEdBQXVCLEVBQUUsQ0FBQztJQUU5Qzs7VUFFTTtJQUNOLGdFQUFnRTtJQUNoRSxnQkFBZ0IsR0FBWSxJQUFJLENBQUM7SUFFakMseUhBQXlIO0lBQ3pILGFBQWEsR0FBWSxLQUFLLENBQUM7SUFFL0IsdUNBQXVDO0lBQ3ZDLEtBQUssR0FBdUIsU0FBUyxDQUFDO0lBRXRDLHVEQUF1RDtJQUN2RCxXQUFXLEdBQXVCLFNBQVMsQ0FBQztJQUU1QyxpR0FBaUc7SUFDakcsV0FBVyxHQUFZLEtBQUssQ0FBQztJQUU3Qix3RUFBd0U7SUFDeEUsUUFBUSxHQUF1QixTQUFTLENBQUM7SUFFekMsa0RBQWtEO0lBQ2xELFNBQVMsR0FB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LEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ2hELE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3JELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsRUFBRSxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUN0RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgdGwgZnJvbSBcImF6dXJlLXBpcGVsaW5lcy10YXNrLWxpYi90YXNrXCI7XG5cbmNsYXNzIElucHV0UGFyYW1ldGVycyB7XG4gIC8vIFwiU2V0IHRvIHRoZSBFbmRvciBMYWJzIEFQSSB0byB1c2UuXCJcbiAgZW5kb3JBUEk6IHN0cmluZyA9IFwiaHR0cHM6Ly9hcGkuZW5kb3JsYWJzLmNvbVwiO1xuXG4gIC8vIFwiU2V0IHRoZSBzZWNyZXQgY29ycmVzcG9uZGluZyB0byB0aGUgQVBJIGtleSB1c2VkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIEVuZG9yIExhYnMuXCJcbiAgYXBpU2VjcmV0OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gXCJTZXQgdGhlIEFQSSBrZXkgdXNlZCB0byBhdXRoZW50aWNhdGUgd2l0aCBFbmRvciBMYWJzXCIuXG4gIGFwaUtleTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiU2V0IHRvIGEgdmVyc2lvbiBvZiBlbmRvcmN0bCB0byBwaW4gdGhpcyBzcGVjaWZpYyB2ZXJzaW9uIGZvciB1c2UuIERlZmF1bHRzIHRvIHRoZSBsYXRlc3QgdmVyc2lvbi5cIlxuICBlbmRvcmN0bFZlcnNpb246IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvLyBcIlNldCB0byB0aGUgY2hlY2tzdW0gYXNzb2NpYXRlZCB3aXRoIGEgcGlubmVkIHZlcnNpb24gb2YgZW5kb3JjdGwuXCJcbiAgZW5kb3JjdGxDaGVja3N1bTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiU2V0IHRoZSBlbmRvcmN0bCBsb2cgbGV2ZWwsIHNlZSBhbHNvIGBsb2dWZXJib3NlYC5cIlxuICBsb2dMZXZlbDogc3RyaW5nIHwgdW5kZWZpbmVkID0gXCJpbmZvXCI7XG5cbiAgLy8gXCJTZXQgdG8gYHRydWVgIHRvIGVuYWJsZSB2ZXJib3NlIGxvZ2dpbmcuXCJcbiAgbG9nVmVyYm9zZTogYm9vbGVhbiB8IHVuZGVmaW5lZCA9IGZhbHNlO1xuXG4gIC8vIFwiU2V0IHRvIHRoZSBuYW1lIG9mIGEgZmlsZSB0byBzYXZlIHJlc3VsdHMgdG8uIEZpbGUgbmFtZSB3aWxsIGJlIGluIHRoZSBgcmVzdWx0c2Agb3V0cHV0IGl0ZW0uIERlZmF1bHQganVzdCB3cml0ZXMgdG8gU1RET1VULlwiXG4gIG91dHB1dEZpbGU6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvLyAgXCJTZXQgdG8gYSBsb2NhdGlvbiBvbiB5b3VyIEdpdEh1YiBydW5uZXIgdG8gb3V0cHV0IHRoZSBmaW5kaW5ncyBpbiBTQVJJRiBmb3JtYXQuXCJcbiAgc2FyaWZGaWxlOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcInNjYW5fcmVzdWx0cy5zYXJpZlwiO1xuXG4gIC8vIFwiU2V0IHRvIHRoZSBuYW1lc3BhY2Ugb2YgdGhlIHByb2plY3QgdGhhdCB5b3UgYXJlIHdvcmtpbmcgd2l0aC5cIlxuICBuYW1lc3BhY2U6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcblxuICAvLyBcIlVzZSB0aGlzIHRvIGFkZCBjdXN0b20gYXJndW1lbnRzIHRvIHRoZSBlbmRvcmN0bCBjb21tYW5kLlwiXG4gIGFkZGl0aW9uYWxQYXJhbWV0ZXJzOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBcIlwiO1xuXG4gIC8qKioqICBcbiAgICBzY2FuIG9wdGlvbnMgXG4gICoqKioqL1xuICAvL1wiU2NhbiBnaXQgY29tbWl0cyBhbmQgZ2VuZXJhdGUgZmluZGluZ3MgZm9yIGFsbCBkZXBlbmRlbmNpZXMuXCJcbiAgc2NhbkRlcGVuZGVuY2llczogYm9vbGVhbiA9IHRydWU7XG5cbiAgLy9cIlNjYW4gYSBzcGVjaWZpZWQgY29udGFpbmVyIGltYWdlLiBUaGUgaW1hZ2UgbXVzdCBiZSBzZXQgd2l0aCBgaW1hZ2VgIGFuZCBhIHByb2plY3QgY2FuIGJlIGRlZmluZWQgd2l0aCBgcHJvamVjdE5hbWVgLlwiXG4gIHNjYW5Db250YWluZXI6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBcIlNwZWNpZnkgYSBjb250YWluZXIgaW1hZ2UgdG8gc2Nhbi5cIlxuICBpbWFnZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiU3BlY2lmeSBhIHByb2plY3QgbmFtZSBmb3IgYSBjb250YWluZXIgaW1hZ2Ugc2Nhbi5cIlxuICBwcm9qZWN0TmFtZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiU2NhbiBhIHNwZWNpZmllZCBhcnRpZmFjdCBvciBhIHBhY2thZ2UuIFRoZSBwYXRoIHRvIGFuIGFydGlmYWN0IG11c3QgYmUgc2V0IHdpdGggYHNjYW5QYXRoYC5cIlxuICBzY2FuUGFja2FnZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIC8vIFwiU2V0IHRvIHRoZSBwYXRoIHRvIHNjYW4uIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LlwiXG4gIHNjYW5QYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG5cbiAgLy8gIFwiU2NhbiBzb3VyY2UgY29kZSByZXBvc2l0b3J5IGZvciBDSS9DRCB0b29scy5cIlxuICBzY2FuVG9vbHM6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyAgXCJTY2FuIHNvdXJjZSBjb2RlIHJlcG9zaXRvcnkgYW5kIGdlbmVyYXRlIGZpbmRpbmdzIGZvciBzZWNyZXRzLiBTZWUgYWxzbyBgc2NhbkdpdExvZ3NgLlwiXG4gIHNjYW5TZWNyZXRzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgLy8gXCJQZXJmb3JtIGEgbW9yZSBjb21wbGV0ZSBhbmQgZGV0YWlsZWQgc2NhbiBvZiBzZWNyZXRzIGluIHRoZSByZXBvc2l0b3J5IGhpc3RvcnkuXG4gIC8vIE11c3QgYmUgdXNlZCB0b2dldGhlciB3aXRoIGBzY2FuU2VjcmV0c2AuXCJcbiAgc2NhbkdpdExvZ3M6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBcIlNjYW4gc291cmNlIGNvZGUgcmVwb3NpdG9yeSBhbmQgZ2VuZXJhdGUgZmluZGluZ3MgZm9yIFNBU1QuXCJcbiAgc2NhblNhc3Q6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAvLyBcIlNwZWNpZnkgYSBsaXN0IG9mIHVzZXItZGVmaW5lZCB0YWdzIHRvIGFkZCB0byB0aGlzIHNjYW4uIFRhZ3MgY2FuIGJlIHVzZWQgdG8gc2VhcmNoIGFuZCBmaWx0ZXIgc2NhbnMgbGF0ZXIuXCJcbiAgdGFnczogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuXG4gIC8vIFwiRW5hYmxlIHBoYW50b20gZGVwZW5kZW5jeSBhbmFseXNpcyB0byBpZGVudGlmeSBkZXBlbmRlbmNpZXMgdXNlZCwgYnV0IG5vdCBkZWNsYXJlZCBpbiB0aGUgbWFuaWZlc3QgZmlsZS5cIlxuICBwaGFudG9tRGVwZW5kZW5jaWVzOiBib29sZWFuID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoKSB7fVxuXG4gIC8vIHZhbGlkYXRpbmcgaW5wdXQgcGFyYW1ldGVycyBwcm92aWRlZCBieSB1c2VyLlxuICBwdWJsaWMgdmFsaWRhdGUoKTogRXJyb3IgfCB1bmRlZmluZWQge1xuICAgIGlmICghdGhpcy5uYW1lc3BhY2UpIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgXCJuYW1lc3BhY2UgaXMgcmVxdWlyZWQgYW5kIG11c3QgYmUgcGFzc2VkIGFzIGFuIGlucHV0IHZhbHVlXCI7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBpZiAoISh0aGlzLmFwaUtleSAmJiB0aGlzLmFwaVNlY3JldCkpIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID0gXCJhcGlLZXkgYW5kIGFwaVNlY3JldCBhcmUgcmVxdWlyZWQgZmllbGQuXCI7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdGhpcy5zY2FuRGVwZW5kZW5jaWVzICYmXG4gICAgICAhdGhpcy5zY2FuU2VjcmV0cyAmJlxuICAgICAgIXRoaXMuc2NhblNhc3QgJiZcbiAgICAgICF0aGlzLnNjYW5Db250YWluZXIgJiZcbiAgICAgICF0aGlzLnNjYW5Ub29scyAmJlxuICAgICAgIXRoaXMuc2NhblBhY2thZ2VcbiAgICApIHtcbiAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgXCJBdCBsZWFzdCBvbmUgb2YgYHNjYW5EZXBlbmRlbmNpZXNgLCBgc2NhblNlY3JldHNgLCBgc2NhblRvb2xzYCwgYHNjYW5TYXN0YCwgYHNjYW5Db250YWluZXJgIG9yIGBzY2FuUGFja2FnZWAgbXVzdCBiZSBlbmFibGVkXCI7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zY2FuQ29udGFpbmVyICYmIHRoaXMuc2NhbkRlcGVuZGVuY2llcykge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICBcIkNvbnRhaW5lciBzY2FuIGFuZCBkZXBlbmRlbmN5IHNjYW4gY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCI7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zY2FuUGFja2FnZSkge1xuICAgICAgaWYgKHRoaXMuc2NhbkNvbnRhaW5lcikge1xuICAgICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgICAgXCJQYWNrYWdlIHNjYW4gYW5kIENvbnRhaW5lciBzY2FuIGNhbm5vdCBiZSBzZXQgYXQgdGhlIHNhbWUgdGltZVwiO1xuICAgICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNjYW5EZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgIFwiUGFja2FnZSBzY2FuIGFuZCBEZXBlbmRlbmN5IHNjYW4gY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCI7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2NhblNlY3JldHMpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgIFwiUGFja2FnZSBzY2FuIGFuZCBTZWNyZXRzIHNjYW4gY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCI7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuc2NhblNhc3QpIHtcbiAgICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICAgIFwiUGFja2FnZSBzY2FuIGFuZCBTQVNUIHNjYW4gY2Fubm90IGJlIHNldCBhdCB0aGUgc2FtZSB0aW1lXCI7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLnByb2plY3ROYW1lKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgICBcIlBsZWFzZSBwcm92aWRlIHByb2plY3QgbmFtZSB2aWEgcHJvamVjdE5hbWUgcGFyYW1ldGVyXCI7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgICAgfVxuICAgICAgaWYgKCF0aGlzLnNjYW5QYXRoKSB7XG4gICAgICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgICBcIlBsZWFzZSBwcm92aWRlIHBhdGggdG8gdGhlIHBhY2thZ2UgdG8gc2NhbiB2aWEgc2NhblBhdGggcGFyYW1ldGVyXCI7XG4gICAgICAgIHJldHVybiBuZXcgRXJyb3IoZXJyb3JNc2cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLnNjYW5HaXRMb2dzICYmICF0aGlzLnNjYW5TZWNyZXRzKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9XG4gICAgICAgIFwiUGxlYXNlIGFsc28gZW5hYmxlIGBzY2FuU2VjcmV0c2AgdG8gc2NhbiBHaXQgbG9ncyBmb3Igc2VjcmV0c1wiO1xuICAgICAgcmV0dXJuIG5ldyBFcnJvcihlcnJvck1zZyk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2NhbkNvbnRhaW5lciAmJiAhdGhpcy5pbWFnZSkge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPVxuICAgICAgICBcImltYWdlIGlzIHJlcXVpcmVkIHRvIHNjYW4gY29udGFpbmVyIGFuZCBtdXN0IGJlIHBhc3NlZCBhcyBhbiBpbnB1dCBmcm9tIHRoZSB3b3JrZmxvdyB2aWEgYW4gaW1hZ2UgcGFyYW1ldGVyXCI7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKGVycm9yTXNnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUlucHV0UGFyYW1zKCk6IElucHV0UGFyYW1ldGVycyB7XG4gIGNvbnN0IHRhc2tBcmdzOiBJbnB1dFBhcmFtZXRlcnMgPSBuZXcgSW5wdXRQYXJhbWV0ZXJzKCk7XG5cbiAgY29uc3QgZW5kb3JBUEkgPSB0bC5nZXRJbnB1dChcImVuZG9yQVBJXCIsIGZhbHNlKTtcbiAgaWYgKGVuZG9yQVBJKSB7XG4gICAgdGFza0FyZ3MuZW5kb3JBUEkgPSBlbmRvckFQSTtcbiAgfVxuXG4gIGNvbnN0IGFwaUtleSA9IHRsLmdldElucHV0KFwiYXBpS2V5XCIsIGZhbHNlKTtcbiAgaWYgKGFwaUtleSkge1xuICAgIHRhc2tBcmdzLmFwaUtleSA9IGFwaUtleTtcbiAgfVxuXG4gIGNvbnN0IGFwaVNlY3JldCA9IHRsLmdldElucHV0KFwiYXBpU2VjcmV0XCIsIGZhbHNlKTtcbiAgaWYgKGFwaVNlY3JldCkge1xuICAgIHRhc2tBcmdzLmFwaVNlY3JldCA9IGFwaVNlY3JldDtcbiAgfVxuXG4gIGNvbnN0IGVuZG9yY3RsVmVyc2lvbiA9IHRsLmdldElucHV0KFwiZW5kb3JjdGxWZXJzaW9uXCIsIGZhbHNlKTtcbiAgaWYgKGVuZG9yY3RsVmVyc2lvbikge1xuICAgIHRhc2tBcmdzLmVuZG9yY3RsVmVyc2lvbiA9IGVuZG9yY3RsVmVyc2lvbjtcbiAgfVxuXG4gIGNvbnN0IGVuZG9yY3RsQ2hlY2tzdW0gPSB0bC5nZXRJbnB1dChcImVuZG9yY3RsQ2hlY2tzdW1cIiwgZmFsc2UpO1xuICBpZiAoZW5kb3JjdGxDaGVja3N1bSkge1xuICAgIHRhc2tBcmdzLmVuZG9yY3RsQ2hlY2tzdW0gPSBlbmRvcmN0bENoZWNrc3VtO1xuICB9XG5cbiAgY29uc3QgbmFtZXNwYWNlID0gdGwuZ2V0SW5wdXQoXCJuYW1lc3BhY2VcIiwgdHJ1ZSk7XG4gIGlmIChuYW1lc3BhY2UpIHtcbiAgICB0YXNrQXJncy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gIH1cblxuICBjb25zdCBsb2dMZXZlbCA9IHRsLmdldElucHV0KFwibG9nTGV2ZWxcIiwgZmFsc2UpO1xuICBpZiAobG9nTGV2ZWwpIHtcbiAgICB0YXNrQXJncy5sb2dMZXZlbCA9IGxvZ0xldmVsO1xuICB9XG5cbiAgY29uc3QgbG9nVmVyYm9zZSA9IHRsLmdldEJvb2xJbnB1dChcImxvZ1ZlcmJvc2VcIiwgZmFsc2UpO1xuICBpZiAobG9nVmVyYm9zZSkge1xuICAgIHRhc2tBcmdzLmxvZ1ZlcmJvc2UgPSBsb2dWZXJib3NlO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0RmlsZSA9IHRsLmdldElucHV0KFwib3V0cHV0RmlsZVwiLCBmYWxzZSk7XG4gIGlmIChvdXRwdXRGaWxlKSB7XG4gICAgdGFza0FyZ3Mub3V0cHV0RmlsZSA9IG91dHB1dEZpbGU7XG4gIH1cblxuICBjb25zdCBzYXJpZkZpbGUgPSB0bC5nZXRJbnB1dChcInNhcmlmRmlsZVwiLCBmYWxzZSk7XG4gIGlmIChzYXJpZkZpbGUpIHtcbiAgICB0YXNrQXJncy5zYXJpZkZpbGUgPSBzYXJpZkZpbGU7XG4gIH1cblxuICBjb25zdCBhZGRpdGlvbmFsQXJndW1lbnRzID0gdGwuZ2V0SW5wdXQoXCJhZGRpdGlvbmFsQXJnc1wiLCBmYWxzZSk7XG4gIGlmIChhZGRpdGlvbmFsQXJndW1lbnRzKSB7XG4gICAgdGFza0FyZ3MuYWRkaXRpb25hbFBhcmFtZXRlcnMgPSBhZGRpdGlvbmFsQXJndW1lbnRzO1xuICB9XG5cbiAgLy8gdGhpcyBuZWVkcyB0byBiZSBwYXJzZWQgYXMgc3RyaW5nIGJlY2F1c2UgdGhlIGRlZmF1bHQgdmFsdWUgaXMgXCJ0cnVlXCIgYW5kXG4gIC8vIHRsLmdldEJvb2xJbnB1dCB3aWxsIHJldHVybiBmYWxzZSBpZiB0aGUgaW5wdXQgaXMgbm90IHNldC5cbiAgY29uc3Qgc2NhbkRlcGVuZGVuY2llcyA9IHRsLmdldElucHV0KFwic2NhbkRlcGVuZGVuY2llc1wiLCBmYWxzZSk7XG4gIGlmIChzY2FuRGVwZW5kZW5jaWVzICYmIHNjYW5EZXBlbmRlbmNpZXMudG9Mb3dlckNhc2UoKSA9PSBcImZhbHNlXCIpIHtcbiAgICB0YXNrQXJncy5zY2FuRGVwZW5kZW5jaWVzID0gZmFsc2U7XG4gIH1cblxuICBjb25zdCBzY2FuQ29udGFpbmVyID0gdGwuZ2V0Qm9vbElucHV0KFwic2NhbkNvbnRhaW5lclwiLCBmYWxzZSk7XG4gIGlmIChzY2FuQ29udGFpbmVyKSB7XG4gICAgdGFza0FyZ3Muc2NhbkNvbnRhaW5lciA9IHNjYW5Db250YWluZXI7XG4gIH1cblxuICBjb25zdCBpbWFnZSA9IHRsLmdldElucHV0KFwiaW1hZ2VcIiwgZmFsc2UpO1xuICBpZiAoaW1hZ2UpIHtcbiAgICB0YXNrQXJncy5pbWFnZSA9IGltYWdlO1xuICB9XG5cbiAgY29uc3QgcHJvamVjdE5hbWUgPSB0bC5nZXRJbnB1dChcInByb2plY3ROYW1lXCIsIGZhbHNlKTtcbiAgaWYgKHByb2plY3ROYW1lKSB7XG4gICAgdGFza0FyZ3MucHJvamVjdE5hbWUgPSBwcm9qZWN0TmFtZTtcbiAgfVxuXG4gIGNvbnN0IHNjYW5QYWNrYWdlID0gdGwuZ2V0Qm9vbElucHV0KFwic2NhblBhY2thZ2VcIiwgZmFsc2UpO1xuICBpZiAoc2NhblBhY2thZ2UpIHtcbiAgICB0YXNrQXJncy5zY2FuUGFja2FnZSA9IHNjYW5QYWNrYWdlO1xuICB9XG5cbiAgY29uc3Qgc2NhblBhdGggPSB0bC5nZXRJbnB1dChcInNjYW5QYXRoXCIsIGZhbHNlKTtcbiAgaWYgKHNjYW5QYXRoKSB7XG4gICAgdGFza0FyZ3Muc2NhblBhdGggPSBzY2FuUGF0aDtcbiAgfVxuXG4gIGNvbnN0IHNjYW5Ub29scyA9IHRsLmdldEJvb2xJbnB1dChcInNjYW5Ub29sc1wiLCBmYWxzZSk7XG4gIGlmIChzY2FuVG9vbHMpIHtcbiAgICB0YXNrQXJncy5zY2FuVG9vbHMgPSBzY2FuVG9vbHM7XG4gIH1cblxuICBjb25zdCBzY2FuU2VjcmV0cyA9IHRsLmdldEJvb2xJbnB1dChcInNjYW5TZWNyZXRzXCIsIGZhbHNlKTtcbiAgaWYgKHNjYW5TZWNyZXRzKSB7XG4gICAgdGFza0FyZ3Muc2NhblNlY3JldHMgPSBzY2FuU2VjcmV0cztcbiAgfVxuXG4gIGNvbnN0IHNjYW5HaXRMb2dzID0gdGwuZ2V0Qm9vbElucHV0KFwic2NhbkdpdExvZ3NcIiwgZmFsc2UpO1xuICBpZiAoc2NhbkdpdExvZ3MpIHtcbiAgICB0YXNrQXJncy5zY2FuR2l0TG9ncyA9IHNjYW5HaXRMb2dzO1xuICB9XG5cbiAgY29uc3Qgc2NhblNhc3QgPSB0bC5nZXRCb29sSW5wdXQoXCJzY2FuU2FzdFwiLCBmYWxzZSk7XG4gIGlmIChzY2FuR2l0TG9ncykge1xuICAgIHRhc2tBcmdzLnNjYW5TYXN0ID0gc2NhblNhc3Q7XG4gIH1cblxuICBjb25zdCB0YWdzID0gdGwuZ2V0SW5wdXQoXCJ0YWdzXCIsIGZhbHNlKTtcbiAgaWYgKHRhZ3MpIHtcbiAgICB0YXNrQXJncy50YWdzID0gdGFncztcbiAgfVxuXG4gIGNvbnN0IHBoYW50b21EZXBlbmRlbmNpZXMgPSB0bC5nZXRCb29sSW5wdXQoXCJwaGFudG9tRGVwZW5kZW5jaWVzXCIsIGZhbHNlKTtcbiAgaWYgKHBoYW50b21EZXBlbmRlbmNpZXMpIHtcbiAgICB0YXNrQXJncy5waGFudG9tRGVwZW5kZW5jaWVzID0gcGhhbnRvbURlcGVuZGVuY2llcztcbiAgfVxuXG4gIGlmICh0YXNrQXJncy5sb2dMZXZlbCA9PSBcImRlYnVnXCIpIHtcbiAgICBsb2dJbnB1dFBhcmFtZXRlcnModGFza0FyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRhc2tBcmdzO1xufVxuXG5mdW5jdGlvbiBsb2dJbnB1dFBhcmFtZXRlcnMocGFyYW1zOiBJbnB1dFBhcmFtZXRlcnMpIHtcbiAgY29uc29sZS5sb2coXCJFbmRvciBBUEkgaXMgc2V0IHRvOlwiLCBwYXJhbXMuZW5kb3JBUEkpO1xuICBjb25zb2xlLmxvZyhcIkFQSSBLZXk6XCIsIHBhcmFtcy5hcGlLZXk/Lmxlbmd0aCk7XG4gIGNvbnNvbGUubG9nKFwiQVBJIFNlY3JldDpcIiwgcGFyYW1zLmFwaVNlY3JldD8ubGVuZ3RoKTtcbiAgY29uc29sZS5sb2coXCJFbmRvcmN0bCBWZXJzaW9uOlwiLCBwYXJhbXMuZW5kb3JjdGxWZXJzaW9uKTtcbiAgY29uc29sZS5sb2coXCJFbmRvcmN0bCBDaGVja3N1bTpcIiwgcGFyYW1zLmVuZG9yY3RsQ2hlY2tzdW0pO1xuICBjb25zb2xlLmxvZyhcIk5hbWVzcGFjZSBpczpcIiwgcGFyYW1zLm5hbWVzcGFjZSk7XG4gIGNvbnNvbGUubG9nKFwiTG9nIExldmVsIGlzOlwiLCBwYXJhbXMubG9nTGV2ZWwpO1xuICBjb25zb2xlLmxvZyhcIkxvZyBWZXJib3NlIGlzOlwiLCBwYXJhbXMubG9nVmVyYm9zZSk7XG4gIGNvbnNvbGUubG9nKFwiT3V0cHV0IEZpbGUgaXM6XCIsIHBhcmFtcy5vdXRwdXRGaWxlKTtcbiAgY29uc29sZS5sb2coXCJTQVJJRiBGaWxlIGlzOlwiLCBwYXJhbXMuc2FyaWZGaWxlKTtcbiAgY29uc29sZS5sb2coXCJBZGRpdGlvbmFsIFBhcmFtZXRlcnMgYXJlOlwiLCBwYXJhbXMuYWRkaXRpb25hbFBhcmFtZXRlcnMpO1xuICBjb25zb2xlLmxvZyhcIlNjYW4gRGVwZW5kZW5jaWVzIGlzOlwiLCBwYXJhbXMuc2NhbkRlcGVuZGVuY2llcyk7XG4gIGNvbnNvbGUubG9nKFwiU2NhbiBDb250YWluZXIgaXM6XCIsIHBhcmFtcy5zY2FuQ29udGFpbmVyKTtcbiAgY29uc29sZS5sb2coXCJJbWFnZSBpczpcIiwgcGFyYW1zLmltYWdlKTtcbiAgY29uc29sZS5sb2coXCJQcm9qZWN0IE5hbWUgaXM6XCIsIHBhcmFtcy5wcm9qZWN0TmFtZSk7XG4gIGNvbnNvbGUubG9nKFwiU2NhbiBQYWNrYWdlIGlzOlwiLCBwYXJhbXMuc2NhblBhY2thZ2UpO1xuICBjb25zb2xlLmxvZyhcIlNjYW4gUGF0aCBpczpcIiwgcGFyYW1zLnNjYW5QYXRoKTtcbiAgY29uc29sZS5sb2coXCJTY2FuIFRvb2xzIGlzOlwiLCBwYXJhbXMuc2NhblRvb2xzKTtcbiAgY29uc29sZS5sb2coXCJTY2FuIFNlY3JldHMgaXM6XCIsIHBhcmFtcy5zY2FuU2VjcmV0cyk7XG4gIGNvbnNvbGUubG9nKFwiU2NhbiBHaXQgTG9ncyBpczpcIiwgcGFyYW1zLnNjYW5HaXRMb2dzKTtcbiAgY29uc29sZS5sb2coXCJTY2FuIFNBU1QgaXM6XCIsIHBhcmFtcy5zY2FuU2FzdCk7XG4gIGNvbnNvbGUubG9nKFwiVGFncyBhcmU6XCIsIHBhcmFtcy50YWdzKTtcbiAgY29uc29sZS5sb2coXCJQaGFudG9tIERlcGVuZGVuY2llcyBpczpcIiwgcGFyYW1zLnBoYW50b21EZXBlbmRlbmNpZXMpO1xufVxuXG5leHBvcnQgeyBJbnB1dFBhcmFtZXRlcnMgfTtcbiJdfQ==