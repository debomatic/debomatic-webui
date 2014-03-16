#!/usr/bin/python

# create a user.config.js file starting from lib/config.js

import os

base_path = os.environ['SCRIPTS_DIR']

global_config_file = os.path.join(base_path, '../lib/config.js')
user_config_file = os.path.join(base_path, '../user.config.js')

if os.path.isfile(user_config_file):
  print ("A config user file already exists. Skipping creation.")
  print user_config_file
  exit()

export_header = """
/*
 * debomatic-webui user configuration
 */

"""

export_config = []

with open(global_config_file) as fd:
  start = False
  for line in fd:
    if line.find('#start config-auto-export') >= 0:
      start = True
      continue
    elif line.find('#end config-auto-export') >= 0:
      break
    if start:
      export_config.append(line)

export_config.append('// DO NOT EDIT THIS LINE:\n')
export_config.append('module.exports = config')

print ("Creating user configuration ...")

with open(user_config_file, 'w') as fd:
  fd.write(export_header)
  fd.write(''.join(export_config))
