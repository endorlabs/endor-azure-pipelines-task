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
| `enableDetachedRefName` | Set to `true` to automatically add detached-ref-name and use the actual branch name instead of commit SHA. Set to `false` to disable this behavior and continue using commit SHA. (Default: `true`)|

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
| `scanAISast` | Set to `true` to enable the `--ai-sast` flag for AI-assisted SAST scanning. (Default: `false`) |
| `scanSecrets` | Scan source code repository and generate findings for secrets. See also `scanGitLogs`. (Default: `false`) |
| `scanTools` | Scan source code repository for CI/CD tools. (Default: `false`) |
| `tags` | Specify a list of user-defined tags to add to this scan. Tags can be used to search and filter scans later. |
| `scanPackage` | Scan a specified artifact or a package. The path to an artifact must be set with `scanPath`. (Default: `false`)|
| `scanContainer` | Scan a specified container image. The image must be set with `image` and a project can be defined with `projectName`. (Default: `false`)|
| `projectName` | Specify a project name for a container image scan or for a package scan.|
| `image` | Specify a container image to scan.|

## Running behind an HTTP proxy

Self-hosted agents that reach the internet only through a corporate proxy are
supported. The task discovers the proxy from one of two places, in this order:

1. **The agent's own proxy configuration** — the `.proxy` file created when the
   agent is configured with `--proxyurl`. Hosts in the agent's bypass list are
   contacted directly.
2. **Proxy environment variables** — the first one set out of `HTTPS_PROXY`,
   `https_proxy`, `HTTP_PROXY`, `http_proxy`. `NO_PROXY` / `no_proxy` is
   honoured, and accepts hostnames, `.domain` suffixes, `host:port` pairs, and
   `*`.

Because environment variables are also read by `endorctl` itself, setting them at
the job or pipeline level covers both the tool download and the scan:

```yaml
- task: Endor-Labs-Scan@1
  displayName: 'Endor Labs Scan'
  env:
    HTTPS_PROXY: 'http://proxy.corp.local:8080'
    NO_PROXY: '.corp.local,artifactory.corp.local'
  inputs:
    serviceConnectionEndpoint: 'endorlabs-service-connection'
    namespace: 'endor'
```

If the proxy requires authentication, supply the credentials in the URL as
`http://user:password@proxy.corp.local:8080`, percent-encoding any reserved
characters in the username or password (for example `\` as `%5C` and `@` as
`%40`). Store the value in a secret variable rather than in the YAML. Prefer the
agent's `--proxyurl` configuration where possible, so the credentials live on the
agent instead of in the pipeline definition.

A few limitations are worth knowing before you start:

- Only **Basic** and **anonymous** proxy authentication are supported. **NTLM and
  Kerberos/Negotiate proxies are not** — they require a challenge-response
  handshake the task does not implement.
- Proxy auto-configuration (**PAC**) scripts and the **Windows system proxy**
  (Internet Options / `netsh winhttp`) are not read. Supply an explicit proxy
  address using one of the two mechanisms above.
- If the proxy **intercepts TLS**, the agent additionally needs to trust your
  internal certificate authority. Point `NODE_EXTRA_CA_CERTS` at your CA bundle,
  or configure the agent with `--sslcacert`.

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