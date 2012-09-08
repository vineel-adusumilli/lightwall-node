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

  /*function resize() {
    $('#swatch').css('height', $(window).height() - getTop('#swatch') - 10);
    $('#smallswatch').css('height', $(window).height() - getTop('.default') - 45); 
  }
  $(window).resize(resize);
  resize();*/
  $('#smallswatch').fadeOut();

  socket.on('recording', function(recording) {
    if (recording) {
      $('nav a div').fadeOut(100);
      $('#swatch').fadeOut(300);
      $('.default').slideUp(300);
      $('.gocrazy').fadeIn(300, function() {
        $(window).resize();
        $('#smallswatch').fadeIn(300);
      });
    } else {
      $('.default').slideDown(300);
      $('#smallswatch').fadeOut(300);
      $('.gocrazy').fadeOut(300);
      $('nav a div').delay(200).fadeIn(100, function() {
        $(window).resize();
        $('#swatch').fadeIn(300);
      });
    }
  });

  function sendRGB(data) {
    socket.emit('rgb', data);
  }

  $('#swatch').colorPicker('images/swatch.jpg', sendRGB);
  $('#smallswatch').colorPicker('images/smallswatch.jpg', sendRGB);

  $('.fire').click(function() {
    socket.emit('fire');
  });

  $('.ice').click(function() {
    socket.emit('ice');
  });
  
  $('.record').click(function() {
    socket.emit('record');
  });

  $('.play').click(function() {
    socket.emit('play');
  });

  $('.stop').click(function() {
    socket.emit('stop');
  });
});

