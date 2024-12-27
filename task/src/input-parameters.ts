import * as tl from "azure-pipelines-task-lib/task";

class InputParameters {
  // "Set to the Endor Labs API to use."
  endorAPI: string = "https://api.endorlabs.com";

  // "Set the secret corresponding to the API key used to authenticate with Endor Labs."
  apiSecret: string | undefined = undefined;

  // "Set the API key used to authenticate with Endor Labs".
  apiKey: string | undefined = undefined;

  // "Set to a version of endorctl to pin this specific version for use. Defaults to the latest version."
  endorctlVersion: string | undefined = undefined;

  // "Set to the checksum associated with a pinned version of endorctl."
  endorctlChecksum: string | undefined = undefined;

  // "Set the endorctl log level, see also `logVerbose`."
  logLevel: string | undefined = "info";

  // "Set to `true` to enable verbose logging."
  logVerbose: boolean | undefined = false;

  // "Set to the name of a file to save results to. File name will be in the `results` output item. Default just writes to STDOUT."
  outputFile: string | undefined = undefined;

  //  "Set to a location on your GitHub runner to output the findings in SARIF format."
  sarifFile: string | undefined = "scan_results.sarif";

  // "Set to the namespace of the project that you are working with."
  namespace: string | undefined = undefined;

  // "Use this to add custom arguments to the endorctl command."
  additionalParameters: string | undefined = "";

  /****  
    scan options 
  *****/
  //"Scan git commits and generate findings for all dependencies."
  scanDependencies: boolean = true;

  //"Scan a specified container image. The image must be set with `image` and a project can be defined with `projectName`."
  scanContainer: boolean = false;

  // "Specify a container image to scan."
  image: string | undefined = undefined;

  // "Specify a project name for a container image scan."
  projectName: string | undefined = undefined;

  // "Scan a specified artifact or a package. The path to an artifact must be set with `scanPath`."
  scanPackage: boolean = false;

  // "Set to the path to scan. Defaults to the current working directory."
  scanPath: string | undefined = undefined;

  //  "Scan source code repository for CI/CD tools."
  scanTools: boolean = false;

  //  "Scan source code repository and generate findings for secrets. See also `scanGitLogs`."
  scanSecrets: boolean = false;

  // "Perform a more complete and detailed scan of secrets in the repository history.
  // Must be used together with `scan_secrets`."
  scanGitLogs: boolean = false;

  // "Scan source code repository and generate findings for SAST."
  scanSast: boolean = false;

  // "Specify a list of user-defined tags to add to this scan. Tags can be used to search and filter scans later."
  tags: string | undefined = undefined;

  // "Enable phantom dependency analysis to identify dependencies used, but not declared in the manifest file."
  phantomDependencies: boolean = false;

  constructor() {}

  // validating input parameters provided by user.
  public validate(): Error | undefined {
    if (!this.namespace) {
      const errorMsg =
        "namespace is required and must be passed as an input value";
      return new Error(errorMsg);
    }

    if (!(this.apiKey && this.apiSecret)) {
      const errorMsg = "apiKey and apiSecret are required field.";
      return new Error(errorMsg);
    }

    if (
      !this.scanDependencies &&
      !this.scanSecrets &&
      !this.scanSast &&
      !this.scanContainer &&
      !this.scanTools &&
      !this.scanPackage
    ) {
      const errorMsg =
        "At least one of `scanDependencies`, `scanSecrets`, `scanTools`, `scanSast`, `scanContainer` or `scanPackage` must be enabled";
      return new Error(errorMsg);
    }

    if (this.scanContainer && this.scanDependencies) {
      const errorMsg =
        "Container scan and dependency scan cannot be set at the same time";
      return new Error(errorMsg);
    }

    if (this.scanPackage) {
      if (this.scanContainer) {
        const errorMsg =
          "Package scan and Container scan cannot be set at the same time";
        return new Error(errorMsg);
      }
      if (this.scanDependencies) {
        const errorMsg =
          "Package scan and Dependency scan cannot be set at the same time";
        return new Error(errorMsg);
      }
      if (this.scanSecrets) {
        const errorMsg =
          "Package scan and Secrets scan cannot be set at the same time";
        return new Error(errorMsg);
      }
      if (this.scanSast) {
        const errorMsg =
          "Package scan and SAST scan cannot be set at the same time";
        return new Error(errorMsg);
      }
      if (!this.projectName) {
        const errorMsg =
          "Please provide project name via projectName parameter";
        return new Error(errorMsg);
      }
      if (!this.scanPath) {
        const errorMsg =
          "Please provide path to the package to scan via scanPath parameter";
        return new Error(errorMsg);
      }
    }

    if (this.scanGitLogs && !this.scanSecrets) {
      const errorMsg =
        "Please also enable `scan_secrets` to scan Git logs for secrets";
      return new Error(errorMsg);
    }

    if (this.scanContainer && !this.image) {
      const errorMsg =
        "image is required to scan container and must be passed as an input from the workflow via an image parameter";
      return new Error(errorMsg);
    }

    return undefined;
  }
}

export function parseInputParams(): InputParameters {
  const taskArgs: InputParameters = new InputParameters();

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

  return taskArgs;
}

export { InputParameters };
