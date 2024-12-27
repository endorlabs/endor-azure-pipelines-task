import { InputParameters } from "../input-parameters";
import { expect, test, describe } from "@jest/globals";

describe("validateInputParameters", () => {
  test("validate the input parameters", () => {
    const inputParams = new InputParameters();

    const err = inputParams.validate();
    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe(
      "namespace is required and must be passed as an input value"
    );

    inputParams.namespace = "test-namespace";
    const err1 = inputParams.validate();
    expect(err1).toBeInstanceOf(Error);
    expect(err1?.message).toBe("apiKey and apiSecret are required field.");

    inputParams.apiKey = "test-api";
    inputParams.apiSecret = "test-secret";
    inputParams.scanDependencies = false;
    const err2 = inputParams.validate();
    expect(err2).toBeInstanceOf(Error);
    expect(err2?.message).toBe(
      "At least one of `scanDependencies`, `scanSecrets`, `scanTools`, `scanSast`, `scanContainer` or `scanPackage` must be enabled"
    );

    inputParams.scanDependencies = true;
    inputParams.scanContainer = true;
    const err3 = inputParams.validate();
    expect(err3).toBeInstanceOf(Error);
    expect(err3?.message).toBe(
      "Container scan and dependency scan cannot be set at the same time"
    );

    inputParams.scanDependencies = false;
    inputParams.scanPackage = true;
    const err4 = inputParams.validate();
    expect(err4).toBeInstanceOf(Error);
    expect(err4?.message).toBe(
      "Package scan and Container scan cannot be set at the same time"
    );

    inputParams.scanContainer = false;
    inputParams.scanDependencies = true;
    const err5 = inputParams.validate();
    expect(err5).toBeInstanceOf(Error);
    expect(err5?.message).toBe(
      "Package scan and Dependency scan cannot be set at the same time"
    );

    inputParams.scanDependencies = false;
    inputParams.scanSecrets = true;
    const err6 = inputParams.validate();
    expect(err6).toBeInstanceOf(Error);
    expect(err6?.message).toBe(
      "Package scan and Secrets scan cannot be set at the same time"
    );

    inputParams.scanSecrets = false;
    inputParams.scanSast = true;
    const err7 = inputParams.validate();
    expect(err7).toBeInstanceOf(Error);
    expect(err7?.message).toBe(
      "Package scan and SAST scan cannot be set at the same time"
    );

    inputParams.scanSast = false;
    inputParams.projectName = undefined;
    const err8 = inputParams.validate();
    expect(err8).toBeInstanceOf(Error);
    expect(err8?.message).toBe(
      "Please provide project name via projectName parameter"
    );

    inputParams.projectName = "test-project";
    inputParams.scanPath = undefined;
    const err9 = inputParams.validate();
    expect(err9).toBeInstanceOf(Error);
    expect(err9?.message).toBe(
      "Please provide path to the package to scan via scanPath parameter"
    );

    inputParams.scanPath = "test-path";
    inputParams.scanSecrets = false;
    inputParams.scanGitLogs = true;
    const err10 = inputParams.validate();
    expect(err10).toBeInstanceOf(Error);
    expect(err10?.message).toBe(
      "Please also enable `scanSecrets` to scan Git logs for secrets"
    );

    inputParams.scanSecrets = true;
    inputParams.scanContainer = true;
    inputParams.scanPackage = false;
    const err11 = inputParams.validate();
    expect(err11).toBeInstanceOf(Error);
    expect(err11?.message).toBe(
      "image is required to scan container and must be passed as an input from the workflow via an image parameter"
    );
  });
});
