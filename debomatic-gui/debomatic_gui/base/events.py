from utils import json2obj
from singleton import Singleton


@Singleton
class Events():
    def __init__(self):
        ## use scripts/get_events_json.js to get these
        events = """
        {
            "error": "error",
            "broadcast": {
                "distributions": "distributions",
                "status_update": "status_update"
            },
            "client": {
                "distribution_packages": {
                    "set": "distribution_packages",
                    "get": "get_distribution_packages",
                    "status": "package_status"
                },
                "package_files_list": {
                    "set": "package_files_list",
                    "get": "get_package_files_list"
                },
                "file": {
                    "set": "file",
                    "get": "get_file"
                },
                "file_newcontent": "file_newcontent",
                "status": "status"
            }
        }
        """
        self.__dict__ = json2obj(events).__dict__
