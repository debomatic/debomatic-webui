from gi.repository import Gtk
from debomatic_gui.base.observers import Observer
from debomatic_gui.base.utils import dict2obj
from debomatic_gui.base.debug import debug

class Sidebar(Gtk.Box):
    def __init__(self, view):
        Gtk.Box.__init__(self, orientation=Gtk.Orientation.VERTICAL)
        Gtk.StyleContext.add_class(self.get_style_context(), \
            "debomatic-sidebar")
        self.packages = PackagesList()
        view.attach_observer(self.packages)

        hbox = Gtk.Box()
        self.files = FilesList()
        view.attach_observer(self.files)
        hbox.add(self.files)

        self.add(self.packages)
        self.add(hbox)


class PackagesList(Gtk.ListBox, Observer):
    def __init__(self):
        Gtk.ListBox.__init__(self)
        self.connect("row-selected", self._on_row_select)
        self.set_header_func(self._list_header_func, None)
        Gtk.StyleContext.add_class(self.get_style_context(), \
            "debomatic-packages")
        self._packages = []

    # FIX_ME: se no packages -> label "No packages yet"
    def update_packages(self, socket_data):
        socket_list = []
        for package in socket_data["distribution"]["packages"]:
            package = dict2obj(package)
            socket_list.append(package)

        for child in self._packages:
            self.remove(child)
        self._packages = []

        for package in socket_list:
            debug(2, "adding package", package.orig_name)
            row = PackageRow(package)
            self.subject.attach_observer(row)
            self.add(row)
            self._packages.append(row)

        # select current package
        if self.subject.package:
            for child in self.get_children():
                if self.subject.package.orig_name == child.tag:
                    self.select_row(child)
                    break
        self.show_all()

    def _on_row_select(self, listbox, row):
        if row and (self.subject.package is None or \
                self.subject.package.orig_name != row.tag):
            self.subject.set_package(row.tag)

    def _list_header_func(self, row, before, user_data):
        if before and not row.get_header():
            row.set_header(Gtk.Separator(orientation=\
                Gtk.Orientation.HORIZONTAL))


class PackageRow(Gtk.ListBoxRow, Observer):
    def __init__(self, package):
        Gtk.ListBoxRow.__init__(self)
        self.tag = "%s" % package.orig_name
        Gtk.StyleContext.add_class(self.get_style_context(), \
            "debomatic-package")

        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=10)
        hbox.set_border_width(8)
        label = Gtk.Label("%s %s" % (package.name, package.version),\
            xalign=0.0)
        hbox.add(label)
        self.add(hbox)

    def update_package_status(self, socket_data):
        # FIX_ME
        pass

    def received_status_update(self, socket_data):
        # FIX_ME
        pass


class FilesList(Gtk.Box, Observer):
    def __init__(self):
        Gtk.Box.__init__(self, orientation=Gtk.Orientation.VERTICAL)
        self.logs = LogFilesList()
        self.sources = FilesExpander("Sources")
        self.debs = FilesExpander("Debs")
        self.add(self.logs)
        self.add(self.sources)
        self.add(self.debs)

    def update_package_files(self, socket_data):
        self.logs.subject = self.subject
        self.logs.set_list(socket_data['package']['files'])
        self.sources.set_list(socket_data['package']['sources'])
        self.debs.set_list(socket_data['package']['debs'], show_extension=True)


class LogFilesList(Gtk.Box):
    def __init__(self, subject=None):
        Gtk.Box.__init__(self, orientation=Gtk.Orientation.VERTICAL)
        Gtk.StyleContext.add_class(self.get_style_context(), "debomatic-logs")
        Gtk.StyleContext.add_class(self.get_style_context(), "linked")
        Gtk.StyleContext.add_class(self.get_style_context(), "vertical")
        self._group = []
        self.subject = subject

    def set_list(self, files_list):
        if len(files_list) == len(self.get_children()):
            for child in self.get_children():
                if self.subject.file.name == child.tag:
                    child.set_active(True)
            return

        for child in self._group:
            self.remove(child)
        self._group = []

        for d_file in files_list:
            d_file = dict2obj(d_file)
            debug(2, "adding log", d_file.name)
            button = Gtk.RadioButton(d_file.name)
            setattr(button, 'tag', "%s" % d_file.name)
            if len(self._group) > 0:
                button.join_group(self._group[0])
            self._group.append(button)
            # auto active button according with current view
            if self.subject.file and \
                    self.subject.file.name == button.tag:
                button.set_active(True)
            button.connect("toggled", self._radiobutton_toggled)
            button.props.draw_indicator = False
            self.add(button)

        self.show_all()

    def _radiobutton_toggled(self, button):
        if button.get_active():
            self.subject.set_file(button.tag)


class FilesExpander(Gtk.Expander):
    def __init__(self, label):
        Gtk.Expander.__init__(self)
        self.set_label(label)
        self.files = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        Gtk.StyleContext.add_class(self.get_style_context(),\
            "debomatic-expander")
        self.add(self.files)
        self._list = []
        self.hide()

    def set_list(self, files_list, show_extension=False):
        for child in self._list:
            self.files.remove(child)
        self._list = []

        if len(files_list) == 0:
            self.hide()

        else:
            for d_file in files_list:
                d_file = dict2obj(d_file)
                if not d_file.name:
                    return
                name = "%s" % d_file.name
                if show_extension and d_file.extension:
                    name = "%s %s" % (name, d_file.extension)
                url = d_file.path
                debug(2, "adding bin", d_file.name)
                button = Gtk.LinkButton(url, name, xalign=0.0)
                button.set_tooltip_markup("%s" % d_file.orig_name)
                self.files.add(button)
                self._list.append(button)
            self.show_all()
