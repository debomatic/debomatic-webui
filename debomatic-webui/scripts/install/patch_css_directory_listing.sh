#!/bin/bash

CSS="${SCRIPTS_DIR}/../node_modules/express/node_modules/connect/node_modules/serve-index/public/style.css"

if [ "`grep debomatic-webui $CSS`" == "" ] ; then
  
  echo "Patching directory listing style.css"
  cp $CSS $CSS.orig
  echo "
  /* debomatic-webui style patch */
  ul#files li {
    float: none;
  }
  /* end debomatic-webui patch */
  " >> $CSS
fi

