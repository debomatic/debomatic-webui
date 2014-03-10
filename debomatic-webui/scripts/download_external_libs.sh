#!/bin/bash

TMP_DIR="`mktemp -d`"
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PUBLIC_DIR="${SCRIPTS_DIR}/../public/external_libs"

get_bootstrap() {
  VERSION="3.1.1"
  NAME="bootstrap-${VERSION}-dist"
  if [ -d ${PUBLIC_DIR}/${NAME} ] ; then return ; fi
  ARCHIVE=${NAME}.zip
  URL="https://github.com/twbs/bootstrap/releases/download/v${VERSION}/${ARCHIVE}"
  cd $TMP_DIR
  echo "Downloading bootstrap ..."
  curl -s -O -L ${URL} &&
  unzip -q ${ARCHIVE} && mv ${NAME} ${PUBLIC_DIR}
  cd && rm -r $TMP_DIR
}

mkdir -p ${PUBLIC_DIR}
get_bootstrap
