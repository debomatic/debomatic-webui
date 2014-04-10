class ExceptionObserverImplementation(Exception):
    pass

class ExceptionSubjectImplementation(Exception):
    pass


class Observer():
    subject = None
    def register_subject(self, subject):
        if not isinstance(subject, Observable):
            raise ExceptionSubjectImplementation("Subject must be \
                a sublcass of Observable")
        else:
            self.subject = subject
    def unregister_subject(self):
        self.subject = None

    def update_distributions(distributions):
        pass
    def update_packages(packages):
        pass
    def update_package_status(package_status):
        pass
    def update_status(status):
        pass
    def update_sigle_status(status):
        pass
    def update_package_files(files):
        pass
    def update_file(file):
        pass
    def update_file_new_content(new_content):
        pass
    def update_error(error):
        pass


class Observable():
    observers = []

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
