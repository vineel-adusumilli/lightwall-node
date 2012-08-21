var socket;

function getPos(canvas, x, y) {
  var obj = canvas;
  var top = 0;
  var left = 0;
  while (obj.tagName != 'BODY') {
    top += obj.offsetTop;
    left += obj.offsetLeft;
    obj = obj.offsetParent;
  }

  return {
    x: x - left + window.pageXOffset,
    y: y - top + window.pageYOffset
  };
}

$(document).ready(function() {
  var aWantsUntrusted = false;

  //socket = io.connect('http://' + window.location.hostname);
  socket = io.connect('http://server.tinyfactory.co:8080');

  socket.on('update rgb', function(data) {
    $('#color').css('background-color', 'rgb(' + data.r + ',' + data.g + ',' + data.b + ')');
  });

  socket.on('recording', function(recording) {
    if (recording) {
      $('#record').text('Stop');
    } else {
      $('#record').text('Record');
    }
  });

  var canvas = $('#canvas')[0];
  var ctx = canvas.getContext('2d');
  var padding = 0;
  var image = new Image();
  image.onload = function() {
    ctx.drawImage(image, padding, padding);
  }
  image.src = 'color_picker.png';

  var mouseDown = false;

  $('#canvas').bind('mousedown', function(evt) {
    mouseDown = true;
    getColor(evt.clientX, evt.clientY);
  }, aWantsUntrusted);

  $('#canvas').bind('mouseup', function() {
    mouseDown = false;
  }, aWantsUntrusted);

  $('#canvas').bind('mouseout', function() {
    mouseDown = false;
  }, aWantsUntrusted);

  $('#canvas').bind('mousemove', function(evt) {
    if (mouseDown)
      getColor(evt.clientX, evt.clientY);
  }, aWantsUntrusted);

  $('#canvas').bind('touchstart', updateTouch, aWantsUntrusted);
  $('#canvas').bind('touchmove', updateTouch, aWantsUntrusted);

  function updateTouch(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    if (evt.targetTouches.length == 1) {
      var touch = event.targetTouches[0];
      getColor(touch.pageX, touch.pageY);
    }
  }

  $('#fire').click(function() {
    socket.emit('fire');
  });

  $('#ice').click(function() {
    socket.emit('ice');
  });

  $('#record').click(function() {
    if ($(this).text() == 'Record') {
      socket.emit('record');
    } else {
      socket.emit('stop');
    }
  });

  $('#play').click(function() {
    socket.emit('play');
  });

  function getColor(x, y) {
    var pos = getPos(canvas, x, y);
    if (pos !== null &&
        pos.x > padding &&
        pos.x < padding + image.width &&
        pos.y > padding &&
        pos.y < padding + image.height) {
      var imageData = ctx.getImageData(padding, padding, image.width, image.height);
      var data = imageData.data;
      var relX = pos.x - padding;
      var relY = pos.y - padding;
      var red = data[((image.width * relY) + relX) * 4];
      var green = data[((image.width * relY) + relX) * 4 + 1];
      var blue = data[((image.width * relY) + relX) * 4 + 2];
      socket.emit('rgb', { r: red, g: green, b: blue });
    }
  }
});

