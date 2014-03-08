var path = require('path')
  , config = require('./config.js')

function __check_data_distribution(data) {
  return data && data.distribution && data.distribution.name
}

function __check_data_package(data) {
  return __check_data_distribution(data) && data.package && data.package.name && data.package.version
}

function __check_data_file(data) {
  return __check_data_package(data) && data.file && data.file.name
}

function __get_distribution_pool_path(data) {
  return path.join(config.debomatic.path, data.distribution.name, 'pool')
}

function __get_package_path(data) {
  return path.join(__get_distribution_pool_path(data), data.package.name + '_' + data.package.version)
}

function __get_file_path(data) {
  return path.join(__get_package_path(data), data.package.name + '_' + data.package.version + '.' + data.file.name)
}

utils = {
  check_data_distribution: function(data) {
    return __check_data_distribution(data)
  },
  check_data_package: function(data) {
    return __check_data_package(data)
  },
  check_data_file: function(data) {
    return __check_data_file(data)
  },
  get_distribution_pool_path: function(data) {
    return __get_distribution_pool_path(data)
  },
  get_package_path: function(data) {
    return __get_package_path(data)
  },
  get_file_path: function(data) {
    return __get_file_path(data)
  },
}

module.exports = utils
