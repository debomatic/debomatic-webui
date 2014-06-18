# Deb-o-Matic - JSON logger module
#
# Copyright (C) 2014 Leo Iannacone
#
# Authors: Leo Iannacone <l3on@ubuntu.com>
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; version 3 of the License.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA.
#
# Log information about debomatic status in a JSON format.
#
# If you want to config this module, please add this info
# to your debomatic.conf
# [jsonlogger]
# jsonfile = /path/to/jsonfile.log

import os
from time import time
from json import dumps as toJSON


class DebomaticModule_JSONLogger:

    def __init__(self):
        self.jsonfile = '/var/log/debomatic-json.log'

    def _set_jsonfile(self, args):
        """If debomatic config file has section [jsonlogger] try to get
        'jsonfile' option and override the default value."""
        if 'opts' in args and args['opts'].has_section('jsonlogger'):
            self.jsonfile = args['opts'].get('jsonlogger', 'jsonfile').strip()

    def _append_info_to_logfile(self, args, info):
        """Write info to jsonfile converted in JSON format."""
        self._set_jsonfile(args)
        info['time'] = int(time())
        with open(self.jsonfile, 'a') as logfd:
            json = toJSON(info)
            logfd.write(json + '\n')

    def _get_distribution_info(self, args):
        """From args to distribution info."""
        info = {}
        info['status'] = args['cmd']
        info['distribution'] = args['distribution']
        if 'success' in args:
            info['success'] = args['success']
        return info

    def _get_package_info(self, args):
        """From args to package info."""
        keys = ['package', 'distribution', 'uploader']
        info = {}
        for k in keys:
            if k in args:
                info[k] = args[k]
        return info

    def pre_chroot(self, args):
        distribution = self._get_distribution_info(args)
        self._append_info_to_logfile(args, distribution)

    def post_chroot(self, args):
        distribution = self._get_distribution_info(args)
        self._append_info_to_logfile(args, distribution)

    def pre_build(self, args):
        package = self._get_package_info(args)
        package['status'] = 'build'
        self._append_info_to_logfile(args, package)

    def post_build(self, args):
        package = self._get_package_info(args)
        package['status'] = 'build'
        package['success'] = False
        resultdir = os.path.join(args['directory'], 'pool', args['package'])
        for filename in os.listdir(resultdir):
            if filename.endswith('.dsc'):
                package['success'] = True
                break
        self._append_info_to_logfile(args, package)
