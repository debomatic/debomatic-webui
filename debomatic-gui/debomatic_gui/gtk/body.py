from gi.repository import Gtk, Pango
from debomatic_gui.base.observers import Observer
from debomatic_gui.base.utils import dict2obj
from debomatic_gui.base.debug import debug

class Body(Gtk.Box, Observer):
    def __init__(self):
        Gtk.Box.__init__(self, orientation=Gtk.Orientation.VERTICAL)

        self.title = Gtk.Label(xalign=0.0)
        Gtk.StyleContext.add_class(self.title.get_style_context(), \
            "debomatic-title")
        headerbar = Gtk.HeaderBar()
        headerbar.add(self.title)

        self.body = Gtk.TextView(editable=False)
        self.body.set_wrap_mode(Gtk.WrapMode.WORD)
        self.modify_font(Pango.FontDescription('monospace'))
        Gtk.StyleContext.add_class(self.title.get_style_context(), \
            "debomatic-body")

        self.add(headerbar)
        self.scroll = Gtk.ScrolledWindow()
        self.scroll.set_policy(Gtk.PolicyType.NEVER,
                          Gtk.PolicyType.AUTOMATIC)
        self.scroll.add(self.body)
        self.pack_start(self.scroll, True, True, 0)

    def set_title(self, title):
        debug(2, "set title", title)
        self.title.set_label(title)
        # FIX ME: aggiungere button salva file

    def set_body(self, body):
        debug(2, "updating body")
        self.body.get_buffer().set_text(body)


    def append_to_body(self, line):
        pass

    def update_file(self, socket_data):
        d_file = dict2obj(socket_data["file"])
        self.set_title(d_file.orig_name)
        self.set_body(d_file.content)

    def update_file_newcontent(self, socket_data):
        # FIX_ME
        pass
