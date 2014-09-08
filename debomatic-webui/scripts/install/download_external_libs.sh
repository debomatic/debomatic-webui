#!/bin/bash

EXT_LIBS_DIR="${SCRIPTS_DIR}/../public/external_libs"

get_bootstrap() {
  VERSION="3.2.0"
  NAME="bootstrap-${VERSION}-dist"
  if [ -d ${EXT_LIBS_DIR}/${NAME} ] ; then return ; fi
  ARCHIVE=${NAME}.zip
  URL="https://github.com/twbs/bootstrap/releases/download/v${VERSION}/${ARCHIVE}"
  echo "Downloading bootstrap ${VERSION} ..."
  curl -s -O -L ${URL} && \
  unzip -q ${ARCHIVE} && rm ${ARCHIVE}
}

get_jquery() {
  VERSION="1.11.0"
  DIR_JQUERY="jquery"
  if [ -d ${EXT_LIBS_DIR}/${DIR_JQUERY} ] ; then return ; fi
  mkdir ${DIR_JQUERY}
  cd ${DIR_JQUERY}
  URL="http://code.jquery.com/jquery-${VERSION}.min.js"
  echo "Downloading jquery ${VERSION} ..."
  curl -s -O -L ${URL}
  cd ..
}

get_tablesorter() {
  DIR_TABLESORTER="tablesorter"
  if [ -d ${EXT_LIBS_DIR}/${DIR_TABLESORTER} ] ; then return ; fi
  mkdir ${DIR_TABLESORTER}
  cd ${DIR_TABLESORTER}
  echo "Downloading tablesorter ..."
  curl -s -O -L "http://mottie.github.io/tablesorter/js/jquery.tablesorter.min.js"
  curl -s -O -L "http://mottie.github.io/tablesorter/js/jquery.tablesorter.widgets.min.js"
  curl -s -O -L "http://mottie.github.io/tablesorter/css/theme.bootstrap.css"
  cd ..
}

get_chartist() {
  VERSION="0.1.11"
  NAME="chartist-js-${VERSION}"
  if [ -d ${EXT_LIBS_DIR}/${NAME} ] ; then return ; fi
  ARCHIVE=v${VERSION}.zip
  URL="https://github.com/gionkunz/chartist-js/archive/${ARCHIVE}"
  echo "Downloading chartist-js ${VERSION} ..."
  curl -s -O -L ${URL} && \
  unzip -q ${ARCHIVE} && rm ${ARCHIVE}
}


if [ ! -d ${EXT_LIBS_DIR} ] ; then mkdir -p ${EXT_LIBS_DIR} ; fi

TMP_DIR="`mktemp -d`"
cd ${TMP_DIR}

get_jquery
get_bootstrap
get_tablesorter
get_chartist

if [ "`ls -1`" != "" ] ; then mv * ${EXT_LIBS_DIR} ; fi
cd && rm -r ${TMP_DIR}
