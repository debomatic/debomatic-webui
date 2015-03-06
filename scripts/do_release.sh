#!/bin/bash

VERSION="$1"
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
PACKAGE="${BASE_DIR}/debomatic-webui/package.json"
CURRENT="`grep '"version":' ${PACKAGE} | awk -F'"' '{print $4}'`"

if [ $# == 0 ] ; then
	echo "Please specify a new version number."
	echo "Current verion is ${CURRENT}"
	exit
fi

y='n'
echo -n "Current version is ${CURRENT}. Bump to ${VERSION} ? [y/N] "
read y
if [ "$y" == "y" -o "$y" == "Y" ] ; then
	sed -r "s/\"version\": \"(.*)\"/\"version\": \"${VERSION}\"/" -i $PACKAGE || exit 1
	y='n'
	echo -n "Do git-commit? [y/N] "
	read y
	if [ "$y" == "y" -o "$y" == "Y" ] ; then
		git commit -m "Bumped version ${VERSION}" ${PACKAGE} History.md
		y='n'
		echo -n "Do git-tag? [y/N] "
		read y
		if [ "$y" == "y" -o "$y" == "Y" ] ; then
			git tag -m "Released version ${VERSION}" "v${VERSION}"
		fi
	fi
fi
