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
# Log information about building packages in a JSON format.

import os
from json import dumps as toJSON


class DebomaticModule_JSONLogger:

    def __init__(self):
        self.logfile = '/var/log/debomatic-json.log'

    def _set_logfile(self, args):
        if args['opts'].has_section('jsonlogger'):
            self.logfile = args['opts'].get('jsonlogger', 'jsonfile').strip()

    def _get_info(self, args):
        keys = ['package', 'distribution', 'uploader']
        info = {}
        for k in keys:
            if args.has_key(k): 
                info[k] = args[k]
        return info

    def pre_build(self, args):
        self._set_logfile(args)
        with open(self.logfile, 'a') as fd:
            package = self._get_info(args)
            package['status'] = 'building'
            json = toJSON(package)
            fd.write(json + '\n')

    def post_build(self, args):
        self._set_logfile(args)
        with open(self.logfile, 'a') as fd:
            status = 'build-failed'
            package = self._get_info(args)
            resultdir = os.path.join(args['directory'], 'pool', args['package'])
            for filename in os.listdir(resultdir):
                if filename.endswith('.dsc'):
                    status = 'build-successed'
                    break
            package['status'] = status
            json = toJSON(package)
            fd.write(json + '\n')
