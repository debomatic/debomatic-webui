#!/bin/bash

EXT_LIBS_DIR="${SCRIPTS_DIR}/../public/external_libs"

get_github() {
  USER=$1
  NAME=$2
  VERSION=$3
  DIST=$4
  ARCHIVE=v${VERSION}.zip
  URL="https://github.com/${USER}/${NAME}/archive/${ARCHIVE}"
  LIB_NAME="${NAME}-${VERSION}"
  if [ -d ${EXT_LIBS_DIR}/${LIB_NAME} ] ; then return ; fi
  echo "Downloading ${NAME} ${VERSION} ..."
  curl -s -O -L ${URL} && \
  unzip -q ${ARCHIVE} && rm ${ARCHIVE}
  if [ "$DIST" != "" ] ; then
    mv ${LIB_NAME} tmp
    mv tmp/${DIST} ${LIB_NAME}
    rm -r tmp
  fi
}

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

if [ ! -d ${EXT_LIBS_DIR} ] ; then mkdir -p ${EXT_LIBS_DIR} ; fi

TMP_DIR="`mktemp -d`"
cd ${TMP_DIR}

get_jquery
get_tablesorter

# get boostrap
get_github "twbs" "bootstrap" "3.2.0" "dist"

# get chartist
get_github "gionkunz" "chartist-js" "0.4.0" "libdist"

if [ "`ls -1`" != "" ] ; then mv * ${EXT_LIBS_DIR} ; fi
cd && rm -r ${TMP_DIR}
