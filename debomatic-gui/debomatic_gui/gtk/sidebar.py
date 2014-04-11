from gi.repository import Gtk
from debomatic_gui.base.observers import Observer
from debomatic_gui.base.utils import dict2obj

class Sibebar(Gtk.Box, Observer):
    def __init__(self):
        Gtk.Box.__init__(self)
        self.packages_list = PackagesList(self)
        self.packages_list.show()
        self.pack_start(self.packages_list, True, True, 0)

    def update_packages(self, socket_data):
        socket_list = []
        for package in socket_data["distribution"]["packages"]:
            package = dict2obj(package)
            socket_list.append(package)
        self.packages_list.update_packages(socket_list)


class PackagesList(Gtk.Box):
    def __init__(self, sidebar):
        Gtk.Box.__init__(self)
        self.sidebar = sidebar
        self.packages = None
        self._packages_list = []
        self.pack_start(self._get_packages_listbox(), True, True, 0)

    def update_packages(self, new_packages):
        view = self.sidebar.subject

        for child in self.packages.get_children():
            self.packages.remove(child)

        for package in new_packages:
            row = self._get_package_as_row(package)
            self.packages.add(row)

        # select current package
        if view.package:
            for child in self.packages.get_children():
                if view.package.orig_name == child.name:
                    self.packages.select_row(child)
                    break

    def _get_packages_listbox(self):
        self.packages = Gtk.ListBox()
        self.packages.set_size_request(200, -1)
        self.packages.connect("row-selected", self._on_row_select)
        self.packages.set_header_func(self._list_header_func, None)
        scroll = Gtk.ScrolledWindow()
        scroll.set_policy(Gtk.PolicyType.NEVER,
                          Gtk.PolicyType.AUTOMATIC)
        scroll.add(self.packages)
        scroll.show()
        self.packages.show()
        return scroll

    def _get_package_as_row(self, package, status=None):
        row = Gtk.ListBoxRow()
        row.name = package.orig_name
        row.show()
        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        hbox.set_border_width(8)
        hbox.show()
        label = Gtk.Label("%s %s" % (package.name, package.version),\
            xalign=0.0)
        label.show()
        hbox.pack_start(label, True, True, 0)
        row.add(hbox)
        return row

    def _on_row_select(self, listbox, row):
        view = self.sidebar.subject
        if row and "name" in row.__dict__ and (view.package is None or \
                view.package.orig_name != row.name):
            view.set_package(row.name)

    def _list_header_func(self, row, before, user_data):
        if before and not row.get_header():
            row.set_header(Gtk.Separator(orientation=\
                Gtk.Orientation.HORIZONTAL))
