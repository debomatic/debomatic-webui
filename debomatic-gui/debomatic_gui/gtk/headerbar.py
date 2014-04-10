from gi.repository import Gtk
from debomatic_gui.base.observers import Observer

class HeaderBar(Gtk.HeaderBar, Observer):

    def __init__(self):
        Gtk.HeaderBar.__init__(self)
        self._group = []
        self._buttons = None
        self.props.show_close_button = True
        self._buttons = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        Gtk.StyleContext.add_class(self._buttons.get_style_context(), "linked")
        self.pack_start(self._buttons)

    def update_distributions(self, distributions):

        for child in self._buttons.get_children():
            self._buttons.remove(child)
        
        self._group = []

        if len(distributions) is 0:
            self._show_no_distributions_label()

        else:
            for distro in distributions:
                self._add_distribution_button(distro)

    def _add_distribution_button(self, distribution):
        button = Gtk.RadioButton(distribution)
        if len(self._group) > 0:
            button.join_group(self._group[0])
        self._group.append(button)
        button.name = distribution
        button.connect("toggled", self.radiobutton_toggled)
        button.props.draw_indicator = False
        self._buttons.add(button)
        button.show()

    def _show_no_distributions_label(self):
        label = "No distributions at the moment"
        self._buttons.add(label)


    def radiobutton_toggled(self, radiobutton):
        if radiobutton.get_active():
            self.subject.set_distribution(radiobutton.name)
