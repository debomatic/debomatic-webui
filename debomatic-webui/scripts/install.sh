#!/bin/bash

export SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

bash ${SCRIPTS_DIR}/install/download_external_libs.sh

python ${SCRIPTS_DIR}/install/create-user-config.py
