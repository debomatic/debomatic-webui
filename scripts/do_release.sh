#!/bin/bash

if [ $# == 0 ] ; then
	echo "Please specify a version number."
	exit
fi

VERSION=$1
BASE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/.."
CONFIG=${BASE_DIR}/debomatic-webui/lib/config.js

CURRENT="`grep "^config.version" ${CONFIG} | awk -F"'" '{print $2}'`"
y='n'
echo -n "Current version is ${CURRENT}. Bump to ${VERSION} ? [y/N] "
read y
if [ "$y" == "y" -o "$y" == "Y" ] ; then
	sed -r "s/^config.version = '(.*)'/config.version = '${VERSION}'/" -i $CONFIG || exit 1
	y='n'
	echo -n "Do git-commit? [y/N] "
	read y
	if [ "$y" == "y" -o "$y" == "Y" ] ; then
		git commit -m "Bumped version ${VERSION}" ${CONFIG}
		y='n'
		echo -n "Do git-tag? [y/N] "
		read y
		if [ "$y" == "y" -o "$y" == "Y" ] ; then
			git tag -m "Released version ${VERSION}" "v${VERSION}"
		fi
	fi
fi
