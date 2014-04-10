from gi.repository import Gtk
from debomatic_gui.gtk.headerbar import HeaderBar

class MyWindow(Gtk.Window):

    def __init__(self, view):
        Gtk.Window.__init__(self)
        self.headerbar = HeaderBar()
        self.view = view
        self.headerbar.set_title("Hello World")
        self.set_titlebar(self.headerbar)
        self.view.attach_observer(self.headerbar)
        self.connect('delete-event', self.on_delete)

        if not self.view.is_started:
            self.view.start()

    def on_delete(self, window, event):
        self.view.stop()
        Gtk.main_quit(window)

if __name__ == '__main__':
    from debomatic_gui.base.view import View

    view = View('localhost')
    win = MyWindow(view)
    win.show_all()
    Gtk.main()

