var net = require('net')
  , sys = require('sys')
  , app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , static = require('node-static');

var ARDUINO_PORT = 5000;
var WEB_PORT = 8080;
var WEB_ROOT = './public';
var file = new(static.Server)(WEB_ROOT, {
  cache: 0,
  headers: { 'X-Powered-By': 'node-static' }
});

var rgb = [ 0, 0, 0 ];

var socket = null;

io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 1);
io.set('transports', [
    'websocket'
  , 'flashsocket'
  , 'htmlfile'
  , 'xhr-polling'
  , 'jsonp-polling'
]);

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
  file.serve(req, res, function(err, result) {
    if (err) {
      console.error('Error serving %s - %s', req.url, err.message);
      res.writeHead(err.status, err.headers);
      res.end(err.status + ' ' + err.message);
    } else {
      console.log('%s - %s', req.url, res.message);
    }
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
