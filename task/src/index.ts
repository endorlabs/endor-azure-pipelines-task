import * as tl from "azure-pipelines-task-lib/task";
import { InputParameters, parseInputParams } from "./input-parameters";
import { setupEndorctl } from "./utils";
import { buildEndorctlRunOptions } from "./scan";
import { AuthInfo } from "./types";
import * as os from "os";

async function run() {
  try {
    console.log(`Current working path: ${process.cwd()}`);
    console.log(`Host machine arch ${os.arch()}`);

    const taskArgs: InputParameters = parseInputParams();
    const endorToken: AuthInfo = getAuthToken();
    if (!endorToken) {
      const errorMsg =
        "auth info is not set. Setup apiKey and apiSecret in service connection and specify serviceConnectionEndpoint input parameter.";
      throw new Error(errorMsg);
    }

    if (!taskArgs.apiKey) {
      taskArgs.apiKey = endorToken.apiKey;
    }

    if (!taskArgs.apiSecret) {
      taskArgs.apiSecret = endorToken.apiSecret;
    }

    taskArgs.validate();

    console.log("Namespace is:", taskArgs.namespace);

    const endorctlPath = await setupEndorctl({
      version: taskArgs.endorctlVersion,
      checksum: taskArgs.endorctlChecksum,
      api: taskArgs.endorAPI,
    });

    let endorctlParams = buildEndorctlRunOptions(taskArgs);

    let toolRunner = tl.tool(endorctlPath).arg(endorctlParams);
    const exitCode = await toolRunner.execAsync();
    if (exitCode != 0) {
      console.log("Failed to scan endorctl");
    }
  } catch (err: any) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

function getAuthToken() {
  const serviceConnectionEndpoint = tl.getInput(
    "serviceConnectionEndpoint",
    false,
  );

  if (!serviceConnectionEndpoint) {
    return { apiKey: undefined, apiSecret: undefined } as AuthInfo;
  } else {
    if (serviceConnectionEndpoint) {
      const endpointAuthorization = tl.getEndpointAuthorization(
        serviceConnectionEndpoint,
        false,
      );
      if (endpointAuthorization) {
        const apiKey = endpointAuthorization.parameters["username"];
        const apiSecret = endpointAuthorization.parameters["password"];

        return { apiKey: apiKey, apiSecret: apiSecret } as AuthInfo;
      }
    }
  }
  return { apiKey: undefined, apiSecret: undefined } as AuthInfo;
}

run();
