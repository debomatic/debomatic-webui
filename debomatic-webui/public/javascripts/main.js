var socket = io.connect('//' + config.hostname );

new Page_Generic().init(socket)

if (window.location.pathname == config.paths.distribution) {
  new Page_Distrubion(socket).start()
}

socket.on(config.events.client.distribution_packages.status, function(data){
  console.log(data)
})