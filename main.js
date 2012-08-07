var net = require('net');
var sys = require('sys');

var stdin = process.openStdin();

var PORT = 8080;
var rgb = [ 0, 0, 0 ];

var socket = null;

net.createServer(function(sock) {
  console.log('Connected!');
  socket = sock;
  sendColors();
  
  process.stdout.write('rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')>');
  stdin.addListener('data', function(d) {
    var raw = d.toString().trim().split(' ');
    if (raw.length == 3) {
      var valid = true;
      for (var i = 0; i < raw.length; i++) {
        raw[i] = parseInt(raw[i]);
        if (!(0 <= raw[i] && raw[i] <= 255))
          valid = false;
        if (raw[i] == 1)
          raw[i] = 2;
      }
      
      if (valid) {
        rgb = raw;
        if (socket)
          sendColors();
      }
    }
    
    process.stdout.write('rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')>');
  });
}).listen(PORT);



function breathe(i) {
  var value;
  value = Math.round((-240 * Math.abs(Math.sin(i * 0.1))) + 255);
  for (var j = 0; j < rgb.length; j++) {
    rgb[j] = value;
  }
  console.log('rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
  sendColors();
  setTimeout(function() {
    breathe(i + 1);
  }, 10);
}

function sendColors() {
  if (socket) {
    var buf = new Buffer(4);
    for (var i = 0; i < 3; i++)
      buf[i] = rgb[i];
    buf[3] = 1;
    socket.write(buf);
  }
}

console.log('Server listening on localhost:' + PORT);