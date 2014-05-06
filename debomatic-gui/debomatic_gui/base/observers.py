class ExceptionObserverImplementation(Exception):
    pass


class ExceptionSubjectImplementation(Exception):
    pass


class Observer(object):
    subject = None

    def register_subject(self, subject):
        if not isinstance(subject, Observable):
            raise ExceptionSubjectImplementation("Subject must be \
                a sublcass of Observable")
        else:
            self.subject = subject

    def unregister_subject(self):
        self.subject = None

    def update_distributions(self, distributions):
        pass

    def update_packages(self, packages):
        pass

    def update_package_status(self, package_status):
        pass

    def update_status(self, status):
        pass

    def update_single_status(self, status):
        pass

    def update_package_files(self, files):
        pass

    def update_file(self, d_file):
        pass

    def update_file_new_content(self, new_content):
        pass

    def update_error(self, error):
        pass


class Observable(object):
    observers = []
    distribution = None
    package = None
    file = None

    def set_distribution(self, distribution):
        pass

    def set_package(self, package):
        pass

    def set_file(self, d_file):
        pass

    def _checkObserverImplements(self, obs):
        if not isinstance(obs, Observer):
            raise ExceptionObserverImplementation("object must be a \
                sublcass of Observer")
        return True

    def attach_observer(self, observer):
        if self._checkObserverImplements(observer):
            if not observer in self.observers:
                self.observers.append(observer)
                observer.register_subject(self)

    def detach_observer(self, observer):
        if self._checkObserverImplements(observer):
            if observer in self.observers:
                self.observers.remove(observer)
                observer.unregister_subject()
