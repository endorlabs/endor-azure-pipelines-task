#!/bin/bash

##  Version to be published.
TASK_VERSION=$1

## Task Id of the extension.
TASK_ID=$2

## Azure DevOps PAT Token to publish the extension.
AZURE_PAT=$3

## Publisher of the extension.
PUBLISHER=$4

## GUID of the extension for production.
PROD_GUID=$5

### Tool setup
$(pwd)/scripts/tool-setup.sh

### Build the task
$(pwd)/scripts/build.sh

### Update the task.json with the new version
node "$(pwd)/scripts/update-task-json.js" ${TASK_VERSION} ${PROD_GUID}

### Update manifest json version content
MANIFEST_OVERRIDE_CONTENT="{ \"id\": \"${TASK_ID}\",\"version\": \"${TASK_VERSION}\", \"public\": false }"

if [ ! -z "$PROD_GUID" -a "$PROD_GUID" != " " ]; then
    echo "Updating manifest for production extension."
    MANIFEST_OVERRIDE_CONTENT="{ \"id\": \"${TASK_ID}\",\"version\": \"${TASK_VERSION}\", \"public\": true }"
fi

### Publish the extension
echo "Publishing the extension to the marketplace with new version ${TASK_VERSION}"

tfx extension publish --manifest-globs vss-extension.json \
--extension-id $TASK_ID \
--version $TASK_VERSION \
--override $MANIFEST_OVERRIDE_CONTENT \
--token $AZURE_PAT \
--publisher $PUBLISHER \
