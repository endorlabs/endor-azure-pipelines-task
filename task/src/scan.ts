import { InputParameters } from "./input-parameters";

export function buildEndorctlRunOptions(
  inputParams: InputParameters,
): string[] {
  const options = [
    `scan`,
    `--api=${inputParams.endorAPI}`,
    `--api-key=${inputParams.apiKey}`,
    `--api-secret=${inputParams.apiSecret}`,
    `--namespace=${inputParams.namespace}`,
    `--verbose=${inputParams.logVerbose}`,
    `--log-level=${inputParams.logLevel}`,
    `--sarif-file=${inputParams.sarifFile}`,
  ];

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

  if (inputParams.scanContainer) {
    options.push(`--container=${inputParams.image}`);
    if (inputParams.projectName) {
      options.push(`--project-name=${inputParams.projectName}`);
    }
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
