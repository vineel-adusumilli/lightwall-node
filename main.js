var net = require('net')
  , sys = require('sys')
  , fs = require('fs')
  , log4js = require('log4js');

log4js.replaceConsole();

var WEB_PORT = 8080;

// static server enabled
var isStatic = process.argv[2] !== '--no-static';

var heartBeat = setTimeout(updateRGB, 1000);

var io;
if (isStatic) {
  var app = require('http').createServer(handler);
  io = require('socket.io').listen(app);
  var stat = require('node-static');
  var WEB_ROOT = './public';
  app.listen(WEB_PORT);
  var file = new(stat.Server)(WEB_ROOT, {
    cache: 0,
    headers: { 'X-Powered-By': 'node-static' }
  });
  function handler(req, res) {
    console.log('Request from: ' + req.connection.remoteAddress);
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
  console.log('Web and socket server listening on localhost:' + WEB_PORT);
} else {
  io = require('socket.io').listen(WEB_PORT);
  console.log('Socket server listening on localhost:' + WEB_PORT);
}

var ARDUINO_PORT = 5000;

var rgb = [ 0, 0, 0 ];

var handshake = {};
var socket = null;
var ready = false;

var record;
var recording = false;
var last;

var timer;

function random(low, high) {
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function pick(x, val) {
  return typeof x === 'undefined' ? val : x;
}

function setColor(raw) {
  var valid = true;
  var i;
  for (i = 0; i < raw.length; i++) {
    raw[i] = parseInt(raw[i], 10);
    if (raw[i] === 1) { raw[i] = 2; }
    if (!(0 <= raw[i] && raw[i] <= 255)) {
      valid = false;
      break;
    }
  }

  updateRecord();

  if (valid) {
    rgb = raw;
  }
  
  updateRGB();
}

function updateRecord() {
  if (recording) {
    var now = Date.now();
    var delta = now - last;
    last = now;
    record.push([rgb, delta]);
  }
}

function updateRGB() {
  io.sockets.emit('update rgb', { r: rgb[0], g: rgb[1], b: rgb[2] });
  
  if (socket && ready) {
    var buf = new Buffer(4);
    var i = 0;
    for (i = 0; i < 3; i++) {
      buf[i] = rgb[i] !== 1 ? rgb[i] : 2;
    }
    buf[3] = 1;
    socket.write(buf);
    ready = false;
  }

  clearTimeout(heartBeat);
  heartBeat = setTimeout(updateRGB, 1000);
}

function fire() {
  setColor([255, random(0, 50), 0]);
  timer = setTimeout(fire, random(200, 400));
}

function ice(curColor) {
  curColor = pick(curColor, [0, 40, 200]);
  var minMax = [
    [0, 0],
    [100, 255],
    [100, 255]
    ];
  var i;
  for (i = 1; i < 3; i++) {
    var change = random(-4, 4);
    curColor[i] = curColor[i] + change;
    if (curColor[i] < minMax[i][0]) {
      curColor[i] = minMax[i][0];
    } else if (curColor[i] > minMax[i][1]) {
      curColor[i] = minMax[i][1];
    }
  }

  setColor(curColor);
  timer = setTimeout(function() {
    ice(curColor);
  }, 30);
}

function play(i) {
  i = pick(i, 0);
  setColor(record[i][0]);

  timer = setTimeout(function() {
    play((i + 1) % record.length);
  }, record[i][1]);
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
  var ip = sock.remoteAddress;
  console.log('Attempted connection from ' + ip);
  handshake[ip] = 'in0';

  sock.on('data', function(data) {
    data = data.toString().trim();

    if (handshake[ip] === 'in0') {
      if (data === 'a') {
        sock.write('b');
        handshake[ip] = 'in1';
      }
    } else if (handshake[ip] === 'in1') {
      if (data === 'c') {
        handshake[ip] = 'ready';
        console.log('Connected to ' + ip);
        socket = sock;
        ready = true;
        updateRGB();
      }
    }
    if (sock === socket) {
      ready = true;
    }
  });

  sock.on('end', function() {
    delete handshake[ip];
    if (sock === socket) {
      socket = null;
      ready = false;
    }
  });
}).listen(ARDUINO_PORT);

io.sockets.on('connection', function(sock) {
  updateRGB();
  
  sock.on('rgb', function (data) {
    clearTimeout(timer);
    setColor([data.r, data.g, data.b]);
  });
  
  sock.on('fire', function() {
    clearTimeout(timer);
    fire();
  });
  
  sock.on('ice', function() {
    clearTimeout(timer);
    ice();
  });

  sock.on('record', function() {
    io.sockets.emit('recording', true);
    record = [];
    recording = true;
    last = Date.now();
  });

  sock.on('stop', function() {
    io.sockets.emit('recording', false);
    updateRecord();
    recording = false;
  });

  sock.on('play', function() {
    if (typeof record !== 'undefined' && !recording) {
      clearTimeout(timer);
      play();
    }
  });
});

console.log('Arduino server listening on localhost:' + ARDUINO_PORT);
