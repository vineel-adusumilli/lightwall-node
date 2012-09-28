function rgb(r, g, b) {
  return 'rgb(' + r + ',' + g + ',' + b + ')';
}

function getTop(ident) {
  var top = 0;
  var obj = $(ident)[0];
  while (obj !== null && obj.tagName !== 'BODY') {
    top += obj.offsetTop;
    obj = obj.offsetParent;
  }
  return top;
}

var socket;

$(document).ready(function() {
  socket = io.connect('http://server.tinyfactory.co:8080');

  socket.on('update rgb', function(data) {
    $('header').css('background-color', rgb(data.r, data.g, data.b));
  });

  socket.on('recording', function(recording) {
  });

  function sendRGB(data) {
    socket.emit('rgb', data);
  }

  $('#swatch').colorPicker('images/swatch.jpg', sendRGB);

  $(document).bind('touchstart', function(e) {
    console.log('body touchstart');
    e.preventDefault();
  });

  $('.fire').click(function() {
    socket.emit('fire');
  });

  $('.ice').click(function() {
    socket.emit('ice');
  });
  
  var recording = false;
  $('.record').click(function() {
    if (recording) {
      socket.emit('stop');
    } else {
      socket.emit('record');
    }
    recording = !recording;
  });

  $('.play').click(function() {
    socket.emit('play');
  });

  $('.stop').click(function() {
    socket.emit('stop');
  });
});

