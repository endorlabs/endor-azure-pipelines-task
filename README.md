# Endor-azure-pipelines-task

Endor Labs helps developers spend less time dealing with security issues and more time accelerating development through safe Open Source Software (OSS) adoption. Our Dependency Lifecycle Management™ Solution helps organizations maximize software reuse by enabling security and development teams to select, secure, and maintain OSS at scale.

The Endor Labs azure pipeline task may be used to repeatably integrate Endor Labs scanning into your ADO CI pipelines.

## Prerequisite

- You must have an account with Endor Labs, please follow [the steps here to sign-in to Endor Labs](https://docs.endorlabs.com/getting-started/sign-in-to-endorlabs/).
  
- [Create API key and API secret to be used for authentication with Endor Labs](https://docs.endorlabs.com/rest-api/authentication/#using-the-ui).

## How to use azure pipeline task/extension

### Step 1

Install the Endor labs extension<Marketplace extension link> into your Azure devops organization.

### Step 2

Configure [service connection end-point](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops) for Endor Labs using the API key and secrets.

### Step 3

Within azure pipelines definition configure the Endor Labs task to scan.

#### Example

```

trigger:
- none

pool:
  name: Azure Pipelines
  vmImage: "windows-latest"

steps:
- task: EndorLabsScan@0
  inputs:
    serviceConnectionEndpoint: 'endorlabs-service-connection'
    namespace: 'endor'

```

## Supported Configuration Parameters

### Common Parameters

The following input global parameters are supported for the Endor Labs Azure pipeline extension:

| Flags | Description |
| :-- | :-- |
| `serviceConnectionEndpoint` | Set the service connection endpoint name created to authenticate with Endor Labs. (Required) |
| `namespace` | Set to the namespace of the project that you are working with. (Required) |
| `endorctlChecksum` | Set to the checksum associated with a pinned version of endorctl. |
| `endorctlVersion` | Set to a version of endorctl to pin this specific version for use. Defaults to the latest version. |
| `logLevel` | Set the log level. (Default: `info`) |
| `logVerbose` | Set to `true` to enable verbose logging. (Default: `false`) |

### Scanning parameters

The following input parameters are also supported for the Endor Labs Azure pipeline extension when used for scanning:

| Flags | Description |
| :-- | :-- |
| `additionalArgs` | Use additionalArgs to add custom arguments to the endorctl scan command. |
| `phantomDependencies` | Set to `true` to enable phantom dependency analysis. (Default: `false`) |
| `sarifFile` | Set to a location on your hosted agent to output the findings in SARIF format. |
| `scanDependencies` | Scan git commits and generate findings for all dependencies. (Default: `true`) |
| `scanGitLogs` | Perform a more complete and detailed scan of secrets in the repository history. Must be used together with `scanSecrets`. (Default: `false`) |
| `scanPath` | Set the path to the directory to scan. (Default: `.`) |
| `scanSast` | Set to `true` to enable sast scan. (Default: `false`) |
| `scanSecrets` | Scan source code repository and generate findings for secrets. See also `scanGitLogs`. (Default: `false`) |
| `scanTools` | Scan source code repository for CI/CD tools. (Default: `false`) |
| `tags` | Specify a list of user-defined tags to add to this scan. Tags can be used to search and filter scans later. |
| `scanPackage` | Scan a specified artifact or a package. The path to an artifact must be set with `scanPath`. (Default: `false`)|
| `scanContainer` | Scan a specified container image. The image must be set with `image` and a project can be defined with `projectName`. (Default: `false`)|
| `projectName` | Specify a project name for a container image scan or for a package scan.|
| `image` | Specify a container image to scan.|

## Example Workflows

### Example: Use sarifFile to view scan result findings in `AdvancedSecurity` tab under `Repos`

```

trigger:
- none

pool:
  name: Azure Pipelines
  vmImage: "windows-latest"

steps:
- task: EndorLabsScan@0
  inputs:
    serviceConnectionEndpoint: 'endorlabs-service-connection'
    namespace: 'endor'
    sarifFile: 'scanresults.sarif'

- task: AdvancedSecurity-Publish@1
  displayName: Publish 'scanresults.sarif' to Advanced Security
  inputs:
   SarifsInputDirectory: $(Build.SourcesDirectory)\

```