var Utils = {
  from_hash_to_view: function (hash) {
    if (! hash )
      hash = window.location.hash
    hash = hash.replace('#', '')
    info = hash.split('/');
    var view = {}
    view.distribution = {}
    view.packages = {}
    view.package = {}
    view.file = {}

    if (info.length >= 1) {
      view.distribution.name = info[0];
    }
    if (info.length >= 3){
      view.package.name = info[1];
      view.package.version = info[2];
      view.package.orig_name = view.package.name + '_' + view.package.version
    }
    if (info.length >= 4) {
      view.file.name = info[3]
      view.file.orig_name = view.package.orig_name + '.' + view.file.name
    }
    return view
  },
  
  from_view_to_hash: function (view) {
    hash = "#"
    if (Utils.check_view_distribution(view)) {
      hash = hash + view.distribution.name
      if (Utils.check_view_package(view)) {
        hash = hash + '/' + view.package.name + "/" + view.package.version
        if (Utils.check_view_file(view))
          hash = hash + '/' + view.file.name
      }
    }
  return hash
  },
  
  check_view_distribution: function(view) {
    return view && view.distribution && view.distribution.name
  },
  
  check_view_package: function(view) {
    return Utils.check_view_distribution(view) && view.package && view.package.name && view.package.version && view.package.orig_name
  },
  
  check_view_file: function(view) {
    return Utils.check_view_package(view) && view.file && view.file.name
  },

  get_status_icon_and_class: function (status_data) {
    var _c = config.status.className
    var _i = config.status.icons
    var _s = status_data
    var className = null
    var icon = null
    if (_s.hasOwnProperty('success')) {
      if (_s.success == true) {
        className = _c.success
        icon = _i.success
      }
      else {
        className = _c.fail
        icon = _i.fail
      }
    }
    else {
      className = _c[_s.status]
      icon = _i[_s.status]
    }
    return {
      className: className,
      icon: icon
    }
  },

  get_status_icon_html: function (status_data) {
    info = Utils.get_status_icon_and_class(status_data)
    return '<span class="icon glyphicon glyphicon-' + info.icon + '"></span>'
  },

  // clone an object via JSON
  clone: function (object) {
    return JSON.parse(JSON.stringify(object));
  }
}
