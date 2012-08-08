var net = require('net')
  , sys = require('sys')
  , app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs');

var ARDUINO_PORT = 5000;
var WEB_PORT = 8080;

var rgb = [ 0, 0, 0 ];

var socket = null;

net.createServer(function(sock) {
  console.log('Connected to Arduino!');
  socket = sock;
  sendColors();
}).listen(ARDUINO_PORT);

function sendColors() {
  if (socket) {
    var buf = new Buffer(4);
    for (var i = 0; i < 3; i++)
      buf[i] = rgb[i];
    buf[3] = 1;
    socket.write(buf);
  }
}

app.listen(WEB_PORT);

function handler(req, res) {
  fs.readFile(__dirname + '/index.html', function(err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function(sock) {
  update_rgb();
  sock.on('illuminate', function (data) {
    var raw = [ data.r, data.g, data.b ];
    var valid = true;
    for (var i = 0; i < raw.length; i++) {
      raw[i] = parseInt(raw[i]);
      if (!(0 <= raw[i] && raw[i] <= 255)) {
        valid = false;
        break;
      }
    }

    if (valid) {
      rgb = raw;
      sendColors();
    }

    update_rgb();
  });
});

function update_rgb() {
  io.sockets.emit('update rgb', { r: rgb[0], g: rgb[1], b: rgb[2] });
}

console.log('Arduino server listening on localhost:' + ARDUINO_PORT);
console.log('Web server listening on localhost:' + WEB_PORT);
