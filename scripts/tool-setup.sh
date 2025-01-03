#!/bin/bash


### Install tfx cli
set +e
tfx version >/dev/null 2>&1
if [[ ! $? -eq 0 ]]; then
  echo "installing tfx-cli .............."
  sudo npm install -g tfx-cli
else
  echo "tfx-cli already installed"
fi
set -e
