from events import Events
from utils import get_query
from debug import debug_socket
from observers import Observable

class View(Observable):

    def __init__(self, socket):
        self.distribution = None
        self.package = None
        self.file = None
        self.socket = socket
        self.events = Events.getInstance()
        self.configure_socket()

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


if __name__ == '__main__':
    from socketIO_client import SocketIO
    from utils import dict2obj
    socket = SocketIO('localhost', 3000)
    view = View(socket)
    distribution = {}
    distribution['name'] = 'trusty'
    view.set_distribution(dict2obj(distribution))
    view.socket.wait()
