from debomatic_gui.base.events import Events
from debomatic_gui.base.utils import get_query, dict2obj
from debomatic_gui.base.debug import debug_socket
from debomatic_gui.base.observers import Observable

from socketIO_client import SocketIO
from threading import Thread


class View(Observable):

    def __init__(self, host, port=3000):
        self.distribution = None
        self.package = None
        self.file = None
        self.thread = None
        self.is_started = False
        self.socket = SocketIO(host, port)
        self.events = Events.getInstance()
        self.configure_socket()

    def start(self):
        self.thread = Thread(target=self.socket.wait)
        self.thread.start()
        self.is_started = True

    def stop(self):
        if self.is_started:
            self.socket.disconnect()
            self.thread._Thread__stop()
            self.is_started = False

    def configure_socket(self):
        _e_client = self.events.client
        self.socket.on(self.events.error, \
            self.received_error)
        self.socket.on(self.events.broadcast.distributions, \
            self.received_distributions)
        self.socket.on(_e_client.status, \
            self.received_status)
        self.socket.on(_e_client.distribution_packages.set, \
            self.received_packages)
        self.socket.on(_e_client.distribution_packages.status, \
            self.received_package_status)
        self.socket.on(self.events.broadcast.status_update, \
            self.received_status_update)
        self.socket.on(_e_client.package_files_list.set, \
            self.received_files_list)
        self.socket.on(_e_client.file.set, \
            self.received_file)
        self.socket.on(_e_client.file_newcontent, \
            self.received_file_newcontent)

    def set_distribution(self, distribution):

        if isinstance(distribution, str) or isinstance(distribution, unicode):
            name = "%s" % distribution
            distribution = {}
            distribution['name'] = name

        if isinstance(distribution, dict):
            distribution = dict2obj(distribution)

        self.distribution = distribution
        event = self.events.client.distribution_packages.get
        query = get_query(self.distribution)
        self.socket.emit(event, query)
        debug_socket("emit", event, query)
        self.socket.emit(event, query)

    def set_package(self, package):
        if isinstance(package, dict):
            package = dict2obj(package)
        self.package = package
        event = self.events.client.package_files.get
        query = get_query(self.distribution, self.package)
        debug_socket("emit", event, query)
        self.socket.emit(event, query)

        # by default get datestamp file
        d_file = {}
        d_file["orig_name"] = "%s.datestamp" % package.orig_name
        self.set_file()
    
    def set_file(self, d_file):
        if isinstance(d_file, dict):
            d_file = dict2obj(d_file)
        self.file = d_file
        event = self.events.client.file.get
        query = get_query(self.distribution, self.package, self.file)
        self.socket.emit(event, query)
        debug_socket("emit", event, query)
    
    def received_error(self, arg):
        debug_socket("received", self.events.error, arg)
        for obs in self.observers:
            obs.update_error(arg)

    def received_distributions(self, arg):
        debug_socket("received", self.events.broadcast.distributions, arg)
        for obs in self.observers:
            obs.update_distributions(arg)

    def received_status(self, arg):
        _e_client = self.events.client
        debug_socket("received", _e_client.status, arg)
        for obs in self.observers:
            obs.update_status(arg)

    def received_packages(self, arg):
        _e_client = self.events.client
        debug_socket("received", _e_client.distribution_packages.set, arg)
        for obs in self.observers:
            obs.update_packages(arg)

    def received_package_status(self, arg):
        _e_client = self.events.client
        debug_socket("received", _e_client.distribution_packages.status, arg)
        for obs in self.observers:
            obs.update_package_status(arg)

    def received_status_update(self, arg):
        debug_socket("received", self.events.broadcast.status_update, arg)
        for obs in self.observers:
            obs.update_single_status(arg)

    def received_files_list(self, arg):
        _e_client = self.events.client
        debug_socket("received", _e_client.package_files_list.set, arg)
        for obs in self.observers:
            obs.update_package_files(arg)

    def received_file(self, arg):
        _e_client = self.events.client
        debug_socket("received", _e_client.file.set, arg)
        for obs in self.observers:
            obs.update_file(arg)

    def received_file_newcontent(self, arg):
        _e_client = self.events.client
        debug_socket("received", _e_client.file_newcontent, arg)
        for obs in self.observers:
            obs.update_file_new_content(arg)
