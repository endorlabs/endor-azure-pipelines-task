#!/bin/bash

# Build the task to generate *.js files
tsc -p ./task/tsconfig.json

# Remove dev dependencies
npm --prefix $(pwd)/task prune --production