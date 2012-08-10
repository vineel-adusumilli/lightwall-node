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

var timer;

function random(low, high) {
	return Math.floor(Math.random() * (high - low + 1)) + low;
}

function pick(x, val) {
	return typeof x == 'undefined' ? val : x;
}

function setColor(raw) {
	var valid = true;
	for (var i = 0; i < raw.length; i++) {
		raw[i] = parseInt(raw[i]);
		if (raw[i] == 1) raw[i] == 2;
		if (!(0 <= raw[i] && raw[i] <= 255)) {
			valid = false;
			break;
		}
	}

	if (valid)
		rgb = raw;
	
	updateRGB();
}

function updateRGB() {
  io.sockets.emit('update rgb', { r: rgb[0], g: rgb[1], b: rgb[2] });
  
  if (socket) {
    var buf = new Buffer(4);
    for (var i = 0; i < 3; i++)
      buf[i] = rgb[i];
    buf[3] = 1;
    socket.write(buf);
  }
}

function fire() {
	setColor([255, random(0, 75), 0]);
	timer = setTimeout(fire, random(200, 400));
}

function blueGlow(curColor) {
	curColor = pick(curColor, [0, 40, 200]);
	var minMax = [
		[0, 0],
		[100, 255],
		[100, 255]
		];
	var i;
	for (i = 1; i < 3; i++) {
		var change = random(-2, 2);
		curColor[i] = curColor[i] + change;
		if (curColor[i] < minMax[i][0]) {
			curColor[i] = minMax[i][0];
		} else if (curColor[i] > minMax[i][1]) {
			curColor[i] = minMax[i][1];
		}
	}

	setColor(curColor);
	timer = setTimeout(function() {
		blueGlow(curColor);
	}, 30);
}

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
  updateRGB();
}).listen(ARDUINO_PORT);

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
  updateRGB();
  
  sock.on('rgb', function (data) {
  	clearTimeout(timer);
    setColor([data.r, data.g, data.b]);
  });
  
  sock.on('fire', function(data) {
  	clearTimeout(timer);
  	fire();
  });
  
  sock.on('blue glow', function(data) {
  	clearTimeout(timer);
  	blueGlow();
  });
});

console.log('Arduino server listening on localhost:' + ARDUINO_PORT);
console.log('Web server listening on localhost:' + WEB_PORT);
