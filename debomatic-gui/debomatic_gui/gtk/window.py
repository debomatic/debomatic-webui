from gi.repository import Gtk
from debomatic_gui.gtk.headerbar import HeaderBar
from debomatic_gui.gtk.sidebar import Sidebar
from debomatic_gui.gtk.body import Body

class MyWindow(Gtk.Window):

    def __init__(self, view):
        Gtk.Window.__init__(self)
        self.view = view
        # header bar
        self.headerbar = HeaderBar()
        self.headerbar.set_title("debomatic amd64")
        self.headerbar.set_subtitle(view.host)
        self.set_titlebar(self.headerbar)
        self.view.attach_observer(self.headerbar)
        self.set_size_request(800, 500)

        hbox = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)

        # sidebar
        sidebar = Sidebar(view)
        hbox.add(sidebar)

        # separator
        hbox.add(Gtk.Separator(orientation=\
                Gtk.Orientation.VERTICAL))

        # body
        body = Body()
        self.view.attach_observer(body)
        hbox.pack_start(body, True, True, 0)

        self.add(hbox)

        self.connect('delete-event', self.on_delete)

        if not self.view.is_started:
            self.view.start()

    def on_delete(self, window, event):
        self.view.stop()
        Gtk.main_quit(window)

if __name__ == '__main__':
    from debomatic_gui.base.view import View

    # view = View('debomatic-amd64.debian.net', 80)
    view = View('localhost')
    win = MyWindow(view)
    win.show_all()
    Gtk.main()

