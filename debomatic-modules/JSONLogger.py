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


class DebomaticModule_JSONLoggerStart:

    def __init__(self):
        self.logger = DebomaticModule_JSONLogger()
        self.first = True

    def pre_chroot(self, args):
        self.logger.pre_chroot(args)

    def pre_build(self, args):
        self.logger.pre_build(args)


class DebomaticModule_JSONLoggerStop:

    def __init__(self):
        self.logger = DebomaticModule_JSONLogger()
        self.last = True

    def post_chroot(self, args):
        self.logger.post_chroot(args)

    def post_build(self, args):
        self.logger.post_build(args)


# The real JSONLogger Class
class DebomaticModule_JSONLogger:

    def __init__(self):
        self.jsonfile = '/var/log/debomatic-json.log'

    def _set_json_logfile_name(self, args):
        """If debomatic config file has section [jsonlogger] try to get
        'jsonfile' option and override the default value."""
        if (args.opts.has_section('jsonlogger') and
                args.opts.has_option('jsonlogger', 'jsonfile')):
            self.jsonfile = args.opts.get('jsonlogger', 'jsonfile').strip()

    def _get_package_json_filename(self, args):
        """Get the path of package JSON file"""
        return ('%(directory)s/pool/%(package)s/%(package)s.json' %
                {'directory': args.directory, 'package': args.package})

    def _get_distribution_status(self, args, with_success=False):
        """From args to distribution status"""
        status = {}
        status['status'] = args.action
        status['distribution'] = args.distribution
        if with_success:
            status['success'] = args.success
        return status

    def _get_package_status(self, args):
        """From args to package status"""
        status = {}
        status['package'] = args.package
        status['distribution'] = args.distribution
        status['uploader'] = args.uploader
        return status

    def _append_json_logfile(self, args, status):
        """Write status to jsonfile in JSON format."""
        self._set_json_logfile_name(args)
        status['time'] = int(time())
        with open(self.jsonfile, 'a') as logfd:
            json = toJSON(status)
            logfd.write(json + '\n')

    def _write_package_json(self, args, status):
        """Write package status to a JSON file."""
        package_json = self._get_package_json_filename(args)
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
            json = toJSON(info, indent=4, sort_keys=True)
            infofd.write(json + '\n')

    def _get_human_size(self, num):
        for x in ['B ', 'KB', 'MB', 'GB', 'TB']:
            if num < 1024.0:
                return "%3.1f %s" % (num, x)
            num /= 1024.0

    def pre_chroot(self, args):
        if args.action is None:
            return
        distribution = self._get_distribution_status(args)
        self._append_json_logfile(args, distribution)

    def post_chroot(self, args):
        if args.action is None:
            return
        distribution = self._get_distribution_status(args, with_success=True)
        self._append_json_logfile(args, distribution)

    def pre_build(self, args):
        package = self._get_package_status(args)
        package['status'] = 'build'
        package_json = self._get_package_json_filename(args)
        if os.path.isfile(package_json):
            os.remove(package_json)
        self._write_package_json(args, package)
        self._append_json_logfile(args, package)

    def post_build(self, args):
        status = self._get_package_status(args)
        status['status'] = 'build'
        status['success'] = args.success
        status['files'] = {}
        resultdir = os.path.join(args.directory, 'pool', args.package)
        for filename in os.listdir(resultdir):
            if filename.endswith('.json'):
                continue
            full_path = os.path.join(resultdir, filename)
            info = {}
            info['size'] = self._get_human_size(os.path.getsize(full_path))
            tag, level = LogParser(full_path).parse()
            if tag:
                info['tags'] = tag
                info['level'] = level
            status['files'][filename] = info
        self._write_package_json(args, status)
        status.pop('files', None)
        self._append_json_logfile(args, status)


# Parser for log files
class LogParser():

    def __init__(self, file_path):
        self.file = file_path
        self.basename = os.path.basename(file_path)
        self.extension = self.basename.split('.').pop()

    def parse(self):
        if not os.path.isfile(self.file):
            return None
        tag = None
        # level can be: info, warning, danger
        level = "info"  # by default
        if self.extension == 'lintian':
            tag, level = self.parse_lintian()
        elif self.extension == 'autopkgtest':
            tag, level = self.parse_autopkgtest()
        elif self.extension == 'piuparts':
            tag, level = self.parse_piuparts()
        elif self.extension == 'blhc':
            tag, level = self.parse_blhc()
        return tag, level

    def parse_lintian(self):
        tags = defaultdict(int)
        with open(self.file, 'r') as fd:
            for line in fd:
                if len(line) >= 2 and line[0] != 'N' and line[1] == ':':
                    tags[line[0]] += 1
        tags = self._from_tags_to_result(tags)
        level = "info"
        if 'E' in tags:
            level = "danger"
        elif 'W' in tags:
            level = "warning"
        return tags, level

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
        return self._from_tags_to_result(tags), 'danger'

    def parse_piuparts(self):
        with open(self.file, 'r') as fd:
            lines = fd.readlines()
            if len(lines) == 0 or lines[-1].find('ERROR:') >= 0:
                return 'E', 'danger'
        return None, None

    def parse_blhc(self):
        tags = defaultdict(int)
        with open(self.file, 'r') as fd:
            for line in fd:
                info = line.split()
                if info[1] != 'missing':
                    continue
                tag = info[0].replace('FLAGS', '')
                tags[tag] += 1
        return ' '.join(sorted(list(tags.keys()))), 'warning'

    def _from_tags_to_result(self, tags):
        keys = sorted(list(tags.keys()))
        result = ["%s%s" % (k, tags[k]) for k in keys]
        return ' '.join(result) if result else None
