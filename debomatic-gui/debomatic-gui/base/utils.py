from json import loads, dumps

class dict2obj(object):
    def __init__(self, d):
        for key, value in d.items():
            if isinstance(value, (list, tuple)):
                setattr(self, key, [dict2obj(x) if \
                    isinstance(x, dict) else x for x in value])
            else:
                setattr(self, key, dict2obj(value) \
                    if isinstance(value, dict) else value)


class json2obj(object):
    def __init__(self, json_str):
        json_dict = loads(json_str)
        self.__dict__ = dict2obj(json_dict).__dict__


def obj2dict(obj):
    data = {}
    for key, value in obj.__dict__.iteritems():
        try:
            if isinstance(value, (list, tuple)):
                data[key] = [obj2dict(x) if \
                    isinstance(x, object) else x for x in value]
            else:
                data[key] = obj2dict(value) \
                    if isinstance(value, object) else value
        except AttributeError:
            data[key] = value
    return data


def obj2json(obj):
    return dumps(obj2dict(obj))

def get_query(distribution, package=None, d_file=None):
    query = {}
    query["distribution"] = {}
    query["distribution"]["name"] = distribution.name

    if package:
        query["package"] = {}
        query["package"]["orig_name"] = package.orig_name
        query["package"]["name"] = package.name
        query["package"]["version"] = package.version

        if d_file:
            query["file"] = {}
            query["file"]["name"] = d_file.name

    return query
