import { InputParameters } from "./input-parameters";

export function buildEndorctlRunOptions(
  inputParams: InputParameters,
): string[] {
  const options: string[] = [];

  if (inputParams.scanContainer) {
    options.push(`container`, `scan`, `${inputParams.image}`);
  } else {
    options.push(`scan`);
  }

  options.push(
    `--api=${inputParams.endorAPI}`,
    `--api-key=${inputParams.apiKey}`,
    `--api-secret=${inputParams.apiSecret}`,
    `--namespace=${inputParams.namespace}`,
    `--verbose=${inputParams.logVerbose}`,
    `--log-level=${inputParams.logLevel}`,
  );

  if (inputParams.scanContainer) {
    if (inputParams.sarifFile) {
      options.push(`--sarif-file=${inputParams.sarifFile}`);
    }

    if (inputParams.osReachability) {
      options.push(`--os-reachability`);
    }

    if (inputParams.dockerfilePath) {
      options.push(`--dockerfile-path=${inputParams.dockerfilePath}`);
    }

    if (inputParams.baseImageName) {
      options.push(`--base-image-name=${inputParams.baseImageName}`);
    }

    if (inputParams.baseImageScan) {
      options.push(`--base-image-scan`);
    }

    if (inputParams.imageType) {
      options.push(`--image-type=${inputParams.imageType}`);
    }

    if (inputParams.outputType) {
      options.push(`--output-type=${inputParams.outputType}`);
    }

    if (inputParams.findingTags) {
      options.push(`--finding-tags=${inputParams.findingTags}`);
    }

    if (inputParams.projectTags) {
      options.push(`--project-tags=${inputParams.projectTags}`);
    }

    if (inputParams.projectName) {
      options.push(`--project-name=${inputParams.projectName}`);
    }
  } else {
    options.push(`--sarif-file=${inputParams.sarifFile}`);

    if (inputParams.scanDependencies) {
      options.push(`--dependencies=true`);
    }

    if (inputParams.scanTools) {
      options.push(`--tools=true`);
    }

    if (inputParams.scanSecrets) {
      options.push(`--secrets=true`);
    }

    if (inputParams.scanSast) {
      options.push(`--sast=true`);
    }

    if (inputParams.scanPackage) {
      options.push(`--package=true`);
      if (inputParams.projectName) {
        options.push(`--project-name=${inputParams.projectName}`);
      }
    }

    if (inputParams.phantomDependencies) {
      options.push(`--phantom-dependencies=true`);
    }

    if (inputParams.scanGitLogs && inputParams.scanSecrets) {
      options.push(`--git-logs=true`);
    }

    if (inputParams.tags) {
      options.push(`--tags=${inputParams.tags}`);
    }
  }

  if (inputParams.scanPath) {
    options.push(`--path=${inputParams.scanPath}`);
  }

  if (inputParams.additionalParameters) {
    const additionalOptions = inputParams.additionalParameters.split(" ");
    if (additionalOptions.length > 0) {
      options.push(...additionalOptions);
    }
  }

  return options;
}
