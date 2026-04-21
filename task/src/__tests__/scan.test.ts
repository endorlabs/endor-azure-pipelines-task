import { InputParameters } from "../input-parameters";
import { buildEndorctlRunOptions } from "../scan";
import { expect, test, describe } from "@jest/globals";

function validContainerParams(): InputParameters {
  const p = baseParams();
  p.scanDependencies = false;
  p.scanContainer = true;
  p.image = "myimage:latest";
  return p;
}

function baseParams(): InputParameters {
  const p = new InputParameters();
  p.namespace = "test-namespace";
  p.apiKey = "test-key";
  p.apiSecret = "test-secret";
  p.endorAPI = "https://api.endorlabs.com";
  p.logVerbose = false;
  p.logLevel = "info";
  p.sarifFile = "scan_results.sarif";
  return p;
}

describe("buildEndorctlRunOptions", () => {
  test("regular dependency scan produces correct command", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanContainer = false;

    const opts = buildEndorctlRunOptions(p);
    expect(opts[0]).toBe("scan");
    expect(opts).toContain("--dependencies=true");
    expect(opts).toContain("--sarif-file=scan_results.sarif");
    expect(opts).not.toContain("container");
  });

  test("container scan uses 'container scan <image>' subcommand", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myregistry/myimage:latest";

    const opts = buildEndorctlRunOptions(p);
    expect(opts[0]).toBe("container");
    expect(opts[1]).toBe("scan");
    expect(opts[2]).toBe("myregistry/myimage:latest");
    expect(opts).not.toContain("--dependencies=true");
    expect(opts).not.toContain("--container=myregistry/myimage:latest");
  });

  test("container scan includes global flags", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--api=https://api.endorlabs.com");
    expect(opts).toContain("--api-key=test-key");
    expect(opts).toContain("--api-secret=test-secret");
    expect(opts).toContain("--namespace=test-namespace");
    expect(opts).toContain("--verbose=false");
    expect(opts).toContain("--log-level=info");
  });

  test("container scan with --os-reachability", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.osReachability = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts[0]).toBe("container");
    expect(opts).toContain("--os-reachability");
  });

  test("container scan with dockerfile-path and base-image-name", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.dockerfilePath = "./Dockerfile";
    p.baseImageName = "ubuntu:22.04";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--dockerfile-path=./Dockerfile");
    expect(opts).toContain("--base-image-name=ubuntu:22.04");
  });

  test("container scan with base-image-scan", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.baseImageScan = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--base-image-scan");
  });

  test("container scan with image-type", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.imageType = "app";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--image-type=app");
  });

  test("container scan with output-type", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.outputType = "json";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--output-type=json");
  });

  test("container scan with finding-tags and project-tags", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.findingTags = "tag1,tag2";
    p.projectTags = "proj-tag1";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--finding-tags=tag1,tag2");
    expect(opts).toContain("--project-tags=proj-tag1");
  });

  test("container scan with project-name", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.projectName = "my-project";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--project-name=my-project");
  });

  test("container scan with all flags combined", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myregistry/myimage:v1.2.3";
    p.osReachability = true;
    p.dockerfilePath = "./docker/Dockerfile.prod";
    p.baseImageName = "node:18-alpine";
    p.baseImageScan = true;
    p.imageType = "app";
    p.outputType = "summary";
    p.findingTags = "release,production";
    p.projectTags = "team-a";
    p.projectName = "my-container-project";
    p.scanPath = "/src";
    p.additionalParameters = "--detached-ref-name=main";

    const opts = buildEndorctlRunOptions(p);
    expect(opts[0]).toBe("container");
    expect(opts[1]).toBe("scan");
    expect(opts[2]).toBe("myregistry/myimage:v1.2.3");
    expect(opts).toContain("--os-reachability");
    expect(opts).toContain("--dockerfile-path=./docker/Dockerfile.prod");
    expect(opts).toContain("--base-image-name=node:18-alpine");
    expect(opts).toContain("--base-image-scan");
    expect(opts).toContain("--image-type=app");
    expect(opts).toContain("--output-type=summary");
    expect(opts).toContain("--finding-tags=release,production");
    expect(opts).toContain("--project-tags=team-a");
    expect(opts).toContain("--project-name=my-container-project");
    expect(opts).toContain("--path=/src");
    expect(opts).toContain("--detached-ref-name=main");
  });

  test("container scan does not include regular scan flags", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.tags = "some-tag";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).not.toContain("--dependencies=true");
    expect(opts).not.toContain("--tools=true");
    expect(opts).not.toContain("--secrets=true");
    expect(opts).not.toContain("--sast=true");
    expect(opts).not.toContain("--tags=some-tag");
  });

  test("regular scan does not include container flags", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanContainer = false;
    p.osReachability = true;
    p.dockerfilePath = "./Dockerfile";

    const opts = buildEndorctlRunOptions(p);
    expect(opts[0]).toBe("scan");
    expect(opts).not.toContain("--os-reachability");
    expect(opts).not.toContain("--dockerfile-path=./Dockerfile");
  });

  test("additional parameters are appended at end for both scan types", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.additionalParameters = "--entrypoint=/app/start.sh --env=KEY=value";

    const opts = buildEndorctlRunOptions(p);
    const entrypointIdx = opts.indexOf("--entrypoint=/app/start.sh");
    const envIdx = opts.indexOf("--env=KEY=value");
    expect(entrypointIdx).toBeGreaterThan(-1);
    expect(envIdx).toBeGreaterThan(entrypointIdx);
  });

  test("container scan with app-scan-context and app-scan-project", () => {
    const p = validContainerParams();
    p.appScanContext = "ctx-123";
    p.appScanProject = "my-app-project";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--app-scan-context=ctx-123");
    expect(opts).toContain("--app-scan-project=my-app-project");
  });

  test("container scan with --as-ref flag", () => {
    const p = validContainerParams();
    p.asRef = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--as-ref");
  });

  test("container scan without --as-ref when false", () => {
    const p = validContainerParams();
    p.asRef = false;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).not.toContain("--as-ref");
  });

  test("container scan with base-image-scan-project", () => {
    const p = validContainerParams();
    p.baseImageScanProject = "base-proj";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--base-image-scan-project=base-proj");
  });

  test("container scan with entrypoint", () => {
    const p = validContainerParams();
    p.entrypoint = "/app/start.sh";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--entrypoint=/app/start.sh");
  });

  test("container scan with env variables", () => {
    const p = validContainerParams();
    p.env = "KEY=value";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--env=KEY=value");
  });

  test("container scan with profiling-data-dir", () => {
    const p = validContainerParams();
    p.profilingDataDir = "/tmp/profiling";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--profiling-data-dir=/tmp/profiling");
  });

  test("container scan with profiling-max-size", () => {
    const p = validContainerParams();
    p.profilingMaxSize = 20;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--profiling-max-size=20");
  });

  test("container scan with profiling-max-size=0 still emits flag", () => {
    const p = validContainerParams();
    p.profilingMaxSize = 0;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--profiling-max-size=0");
  });

  test("container scan with publish ports", () => {
    const p = validContainerParams();
    p.publish = "8080:80";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--publish=8080:80");
  });

  test("container scan with volume mount", () => {
    const p = validContainerParams();
    p.volume = "/host/path:/container/path";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--volume=/host/path:/container/path");
  });

  test("container scan command ordering: subcommand, image, then flags", () => {
    const p = validContainerParams();
    p.osReachability = true;

    const opts = buildEndorctlRunOptions(p);
    const containerIdx = opts.indexOf("container");
    const scanIdx = opts.indexOf("scan");
    const imageIdx = opts.indexOf("myimage:latest");
    const flagIdx = opts.indexOf("--os-reachability");

    expect(containerIdx).toBe(0);
    expect(scanIdx).toBe(1);
    expect(imageIdx).toBe(2);
    expect(flagIdx).toBeGreaterThan(imageIdx);
  });

  test("container scan includes --sarif-file when set", () => {
    const p = validContainerParams();
    p.sarifFile = "container_results.sarif";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--sarif-file=container_results.sarif");
  });

  test("container scan omits --sarif-file when not set", () => {
    const p = validContainerParams();
    p.sarifFile = undefined;

    const opts = buildEndorctlRunOptions(p);
    expect(opts.some((o) => o.startsWith("--sarif-file"))).toBe(false);
  });
});

describe("InputParameters.validate", () => {
  test("returns error when namespace is missing", () => {
    const p = baseParams();
    p.namespace = undefined;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when apiKey is missing", () => {
    const p = baseParams();
    p.apiKey = undefined;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when apiSecret is missing", () => {
    const p = baseParams();
    p.apiSecret = undefined;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when no scan type is enabled", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = false;
    p.scanSecrets = false;
    p.scanSast = false;
    p.scanTools = false;
    p.scanPackage = false;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanContainer and scanDependencies are both true", () => {
    const p = baseParams();
    p.scanContainer = true;
    p.scanDependencies = true;
    p.image = "myimage:latest";
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanContainer is true but image is missing", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = undefined;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns undefined for valid container scan", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanContainer = true;
    p.image = "myimage:latest";
    expect(p.validate()).toBeUndefined();
  });

  test("returns undefined for valid dependency scan", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanContainer = false;
    expect(p.validate()).toBeUndefined();
  });

  test("returns error when scanPackage and scanContainer are both true", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.scanContainer = true;
    p.image = "myimage:latest";
    p.projectName = "proj";
    p.scanPath = "/src";
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanPackage and scanDependencies are both true", () => {
    const p = baseParams();
    p.scanPackage = true;
    p.scanDependencies = true;
    p.projectName = "proj";
    p.scanPath = "/src";
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanPackage and scanSecrets are both true", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.scanSecrets = true;
    p.projectName = "proj";
    p.scanPath = "/src";
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanPackage and scanSast are both true", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.scanSast = true;
    p.projectName = "proj";
    p.scanPath = "/src";
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanPackage is true but projectName is missing", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.scanPath = "/src";
    p.projectName = undefined;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns error when scanPackage is true but scanPath is missing", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.projectName = "proj";
    p.scanPath = undefined;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns undefined for valid package scan", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.projectName = "proj";
    p.scanPath = "/path/to/package";
    expect(p.validate()).toBeUndefined();
  });

  test("returns error when scanGitLogs is true but scanSecrets is false", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanGitLogs = true;
    p.scanSecrets = false;
    expect(p.validate()).toBeInstanceOf(Error);
  });

  test("returns undefined when scanGitLogs and scanSecrets are both true", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanGitLogs = true;
    p.scanSecrets = true;
    expect(p.validate()).toBeUndefined();
  });
});

describe("buildEndorctlRunOptions - regular scan flags", () => {
  test("scanTools adds --tools=true", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanTools = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--tools=true");
  });

  test("scanSecrets adds --secrets=true", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanSecrets = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--secrets=true");
  });

  test("scanSast adds --sast=true", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanSast = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--sast=true");
  });

  test("scanGitLogs with scanSecrets adds --git-logs=true", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanSecrets = true;
    p.scanGitLogs = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--git-logs=true");
  });

  test("scanGitLogs without scanSecrets does not add --git-logs", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanSecrets = false;
    p.scanGitLogs = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).not.toContain("--git-logs=true");
  });

  test("phantomDependencies adds --phantom-dependencies=true", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.phantomDependencies = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--phantom-dependencies=true");
  });

  test("tags adds --tags", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.tags = "v1.0,release";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--tags=v1.0,release");
  });

  test("scanPackage adds --package=true and --project-name", () => {
    const p = baseParams();
    p.scanDependencies = false;
    p.scanPackage = true;
    p.projectName = "my-pkg";
    p.scanPath = "/path/to/artifact";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--package=true");
    expect(opts).toContain("--project-name=my-pkg");
    expect(opts).toContain("--path=/path/to/artifact");
  });

  test("regular scan always includes --sarif-file", () => {
    const p = baseParams();
    p.scanDependencies = true;

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--sarif-file=scan_results.sarif");
  });

  test("scanPath is included for regular scans", () => {
    const p = baseParams();
    p.scanDependencies = true;
    p.scanPath = "/repo";

    const opts = buildEndorctlRunOptions(p);
    expect(opts).toContain("--path=/repo");
  });
});
