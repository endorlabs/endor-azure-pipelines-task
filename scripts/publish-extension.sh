#!/bin/bash

##  Version to be published.
TASK_VERSION=$1

TASK_ID=$2

AZURE_PAT=$3

### Tool setup
$(pwd)/scripts/tool-setup.sh

### Build the task
$(pwd)/scripts/build.sh

### Update the task.json with the new version
node "$(pwd)/scripts/update-task-json.js" ${TASK_VERSION}

### Update manifest json version content
MANIFEST_OVERRIDE_CONTENT="{ \"id\": \"${TASK_ID}\",\"version\": \"${TASK_VERSION}\", \"public\": false }"


### Publish the extension
echo "Publishing the extension to the marketplace with new version ${TASK_VERSION}"

tfx extension publish --manifest-globs vss-extension.json \
--extension-id $TASK_ID \
--version $TASK_VERSION \
--override $MANIFEST_OVERRIDE_CONTENT \
--token $AZURE_PAT