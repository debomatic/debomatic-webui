LEVEL = 4

def debug(level, *args):
    if level <= LEVEL:
        print("debug [%s]" % level, args)

def debug_socket(what, event, data):
    level = 3
    if what == "received":
        level = 4
    debug(level, "socket", what, "event:", event, "data:", data)
