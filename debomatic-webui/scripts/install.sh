#!/bin/bash

export SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

bash install/remove_css_directory_listing.sh
bash install/download_external_libs.sh
