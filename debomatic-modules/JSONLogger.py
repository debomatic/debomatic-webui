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
from collections import defaultdict


# ZZ and 00 are wrappers for JSONLogger to get module run
# as first and as last one for pre_* and post_* hooks
class DebomaticModule_00_JSONLogger:
    def __init__(self):
        self.logger = JSONLogger.Instance()

    def pre_chroot(self, args):
        self.logger.pre_chroot(args)

    def pre_build(self, args):
        self.logger.pre_build(args)


class DebomaticModule_ZZ_JSONLogger:
    def __init__(self):
        self.logger = JSONLogger.Instance()

    def post_chroot(self, args):
        self.logger.post_chroot(args)

    def post_build(self, args):
        self.logger.post_build(args)


# Singleton decorator
class Singleton:
    def __init__(self, decorated):
        self._decorated = decorated

    def Instance(self):
        try:
            return self._instance
        except AttributeError:
            self._instance = self._decorated()
            return self._instance

    def __call__(self):
        raise TypeError('Singletons must be accessed through `Instance()`.')


# The real JSONLogger Class
@Singleton
class JSONLogger:

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
        status['tags'] = {}
        resultdir = os.path.join(args['directory'], 'pool', args['package'])
        for filename in os.listdir(resultdir):
            if filename.endswith('.dsc'):
                status['success'] = True
            else:
                full_path = os.path.join(resultdir, filename)
                tag = LogParser(full_path).parse()
                if tag:
                    status['tags'][filename] = tag
        self._write_package_json(args, status)
        self._write_json_logfile(args, status)


# Parser for log files
class LogParser():
    def __init__(self, file_path):
        self.file = file_path
        self.basename = os.path.basename(file_path)
        self.extension = self.basename.split('.').pop()

    def parse(self):
        if not os.path.isfile(self.file):
            return None
        result = None
        if self.extension == 'lintian':
            result = self.parse_lintian()
        elif self.extension == 'autopkgtest':
            result = self.parse_autopkgtest()
        elif self.extension == 'piuparts':
            result = self.parse_piuparts()
        return result

    def parse_lintian(self):
        tags = defaultdict(int)
        with open(self.file, 'r') as fd:
            for line in fd:
                if len(line) >= 2 and line[0] != 'N' and line[1] == ':':
                    tags[line[0]] += 1
        return self._from_tags_to_result(tags)

    def parse_autopkgtest(self):
        tags = defaultdict(int)
        with open(self.file, 'r') as fd:
            found = False
            pass_next = False
            for line in fd:
                if pass_next:
                    pass_next = False
                    continue
                if not found and line.find('Tests summary') >= 0:
                    found = True
                    pass_next = True
                elif found and len(line.split()) >= 2:
                    info = line.split()[1]
                    if info == 'PASS':
                        continue
                    tags[info[0]] += 1
                elif found and line == '\n':
                    break
        return self._from_tags_to_result(tags)

    def parse_piuparts(self):
        with open(self.file, 'r') as fd:
            last_line = fd.readlines()[-1]
            if last_line.find('ERROR:') >= 0:
                return 'E'
        return None

    def _from_tags_to_result(self, tags):
        keys = sorted(list(tags.keys()))
        result = []
        for k in keys:
            result.append("%s%s" % (k, tags[k]))
        if len(result) > 0:
            return ' '.join(result)
        return None
