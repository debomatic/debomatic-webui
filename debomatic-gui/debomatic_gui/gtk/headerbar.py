from gi.repository import Gtk
from debomatic_gui.base.observers import Observer

class HeaderBar(Gtk.HeaderBar, Observer):

    def __init__(self):
        Gtk.HeaderBar.__init__(self)
        self.props.show_close_button = True
        self._group = []
        self._buttons = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL)
        Gtk.StyleContext.add_class(self._buttons.get_style_context(), "linked")
        self.pack_start(self._buttons)
        self.auto_populated = False

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
        # auto active button according with current view
        if self.subject.distribution and \
                self.subject.distribution.name == button.name:
            button.set_active(True)
        button.connect("toggled", self._radiobutton_toggled)
        button.props.draw_indicator = False
        self._buttons.add(button)
        button.show()
        # only at startup
        if not self.auto_populated:
            self.auto_populated = True
            self.subject.set_distribution(self._group[0].name)


    def _show_no_distributions_label(self):
        label = Gtk.Label("No distribution at the moment")
        self._buttons.add(label)
        label.show()


    def _radiobutton_toggled(self, button):
        if button.get_active():
            self.subject.set_distribution(button.name)
