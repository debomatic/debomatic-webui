#!/usr/bin/python

# create a user.config.js file starting from lib/config.js

import os

base_path = os.environ['SCRIPTS_DIR']

global_config_file = os.path.join(base_path, '../lib/config.coffee')
user_config_file = os.path.join(base_path, '../user.config')

if os.path.isfile(user_config_file):
    print ("A config user file already exists. Skipping creation.")
    exit()

export_header = """###
debomatic-webui user configuration
###

"""
export_config = [export_header]

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

print ("Creating user configuration ...")

with open(user_config_file, 'w') as fd:
    fd.write(''.join(export_config))
