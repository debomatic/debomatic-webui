from gi.repository import Gtk
from debomatic_gui.base.observers import Observer
from debomatic_gui.base.utils import dict2obj

class Sidebar(Gtk.Box):
    def __init__(self, view):
        Gtk.Box.__init__(self)
        self.packages = PackagesList()
        view.attach_observer(self.packages)

        self.pack_start(self.packages, True, True, 0)


class PackagesList(Gtk.ListBox, Observer):
    def __init__(self):
        Gtk.ListBox.__init__(self)
        self.set_size_request(200, -1)
        self.connect("row-selected", self._on_row_select)
        self.set_header_func(self._list_header_func, None)

    def update_packages(self, socket_data):
        socket_list = []
        for package in socket_data["distribution"]["packages"]:
            package = dict2obj(package)
            socket_list.append(package)

        for child in self.get_children():
            self.remove(child)

        for package in socket_list:
            row = PackageRow(package)
            self.subject.attach_observer(row)
            row.show()
            self.add(row)

        # select current package
        if self.subject.package:
            for child in self.get_children():
                if self.subject.package.orig_name == child.name:
                    self.select_row(child)
                    break

    def _on_row_select(self, listbox, row):
        if row and "name" in row.__dict__ and (self.subject.package is None or \
                self.subject.package.orig_name != row.name):
            self.subject.set_package(row.name)

    def _list_header_func(self, row, before, user_data):
        if before and not row.get_header():
            row.set_header(Gtk.Separator(orientation=\
                Gtk.Orientation.HORIZONTAL))


class PackageRow(Gtk.ListBoxRow, Observer):
    def __init__(self, package):
        Gtk.ListBoxRow.__init__(self)
        self.name = package.orig_name

        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        hbox.set_border_width(8)
        hbox.show()
        label = Gtk.Label("%s %s" % (package.name, package.version),\
            xalign=0.0)
        label.show()
        hbox.pack_start(label, True, True, 0)
        self.add(hbox)

    def update_package_status(self, socket_data):
        # FIX ME
        pass

    def received_status_update(self, socket_data):
        # FIX ME
        pass


class FilesList(Gtk.Box, Observer):
    def __init__(self):
        Gtk.Box.__init__(self)
        pass
