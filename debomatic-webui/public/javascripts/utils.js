var Utils = {
  from_hash_to_data: function (hash) {
    if (! hash )
      hash = window.location.hash
    hash = hash.replace('#', '')
    info = hash.split('/');
    data = {}
    if (info.length >= 1) {
      data.distribution = {}
      data.distribution.name = info[0];
    }
    if (info.length >= 3){
      data.package = {}
      data.package.name = info[1];
      data.package.version = info[2];
      data.package.orig_name = data.package.name + '_' + data.package.version
    }
    if (info.length >= 4) {
      data.file = {}
      data.file.name = info[3]
      data.file.orig_name = data.package.orig_name + '.' + data.file.name
    }
    return data
  },
  
  from_data_to_hash: function (data) {
    hash = "#"
    if (Utils.check_data_distribution(data)) {
      hash = hash + data.distribution.name
      if (Utils.check_data_package(data)) {
        hash = hash + '/' + data.package.name + "/" + data.package.version
        if (Utils.check_data_file(data))
          hash = hash + '/' + data.file.name
      }
    }
  return hash
  },
  
  check_data_distribution: function(data) {
    return data && data.distribution && data.distribution.name
  },
  
  check_data_package: function(data) {
    return Utils.check_data_distribution(data) && data.package && data.package.name && data.package.version && data.package.orig_name
  },
  
  check_data_file: function(data) {
    return Utils.check_data_package(data) && data.file && data.file.name
  },

  get_status_icon_and_class: function (status_data) {
    var _c = config.status.className
    var _i = config.status.icons
    var _s = status_data
    var className = null
    var icon = null
    if (_s.status == config.status.package.building) {
      className = _c.building
      icon = _i.building
    }
    else if (_s.status == config.status.package.failed) {
      className = _c.failed
      icon = _i.failed
    }
    else {
      className = _c.successed
      icon = _i.successed
    }
    return {
      className: className,
      icon: icon
    }
  },

  get_status_icon_html: function (status_data) {
    info = Utils.get_status_icon_and_class(status_data)
    return '<span class="icon glyphicon glyphicon-' + info.icon + '"></span>'
  }
}
