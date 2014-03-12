#!/bin/bash

CSS="${SCRIPTS_DIR}/../node_modules/express/node_modules/connect/lib/public/style.css"

if [ "`stat -c '%s' "$CSS"`" -gt 1 ] ; then
  echo "Removing css from express directory listing ..."
  echo "" > $CSS
fi
