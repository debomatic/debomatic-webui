function Preferences() {

  // update config.preferences according with user choices
  this.load = function() {
    for (setting in config.preferences) {
      if ((value = localStorage.getItem(setting))) {
        config.preferences[setting] = JSON.parse(value)
      }
    }
  }

  this.load()
}