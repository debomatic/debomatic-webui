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
from json import load as fileToJSON


class DebomaticModule_JSONLogger:

    def __init__(self):
        self.jsonfile = '/var/log/debomatic-json.log'

    def _set_json_logfile_name(self, args):
        """If debomatic config file has section [jsonlogger] try to get
        'jsonfile' option and override the default value."""
        if 'opts' in args and args['opts'].has_section('jsonlogger'):
            self.jsonfile = args['opts'].get('jsonlogger', 'jsonfile').strip()

    def _write_json_logfile(self, args, status):
        """Write status to jsonfile in JSON format."""
        self._set_json_logfile_name(args)
        status['time'] = int(time())
        with open(self.jsonfile, 'a') as logfd:
            json = toJSON(status)
            logfd.write(json + '\n')

    def _get_package_json(self, args):
        """Get the path of package JSON file"""
        return '%(directory)s/pool/%(package)s/%(package)s.json' % args

    def _write_package_json(self, args, status):
        """Write package status to a JSON file."""
        package_json = self._get_package_json(args)
        if os.path.isfile(package_json):
            with open(package_json, 'r') as infofd:
                try:
                    info = fileToJSON(infofd)
                    info['end'] = int(time())
                except:
                    return
        else:
            info = {'start': int(time())}

        for key in status:
            if key not in info:
                info[key] = status[key]

        with open(package_json, 'w') as infofd:
            json = toJSON(info, indent=4)
            infofd.write(json + '\n')

    def _get_distribution_status(self, args):
        """From args to distribution status"""
        status = {}
        status['status'] = args['cmd']
        status['distribution'] = args['distribution']
        if 'success' in args:
            status['success'] = args['success']
        return status

    def _get_package_status(self, args):
        """From args to package status"""
        keys = ['package', 'distribution', 'uploader']
        status = {}
        for k in keys:
            if k in args:
                status[k] = args[k]
        return status

    def pre_chroot(self, args):
        distribution = self._get_distribution_status(args)
        self._write_json_logfile(args, distribution)

    def post_chroot(self, args):
        distribution = self._get_distribution_status(args)
        self._write_json_logfile(args, distribution)

    def pre_build(self, args):
        package = self._get_package_status(args)
        package['status'] = 'build'
        package_json = self._get_package_json(args)
        if os.path.isfile(package_json):
            os.remove(package_json)
        self._write_package_json(args, package)
        self._write_json_logfile(args, package)

    def post_build(self, args):
        status = self._get_package_status(args)
        status['status'] = 'build'
        status['success'] = False
        resultdir = os.path.join(args['directory'], 'pool', args['package'])
        for filename in os.listdir(resultdir):
            if filename.endswith('.dsc'):
                status['success'] = True
                break
        self._write_package_json(args, status)
        self._write_json_logfile(args, status)
