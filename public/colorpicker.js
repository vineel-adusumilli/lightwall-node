(function($) {
  function getPos(canvas, x, y) {
    var obj = canvas;
    var top = 0;
    var left = 0;
    while (obj.tagName !== 'BODY') {
      top += obj.offsetTop;
      left += obj.offsetLeft;
      obj = obj.offsetParent;
    }

    return {
      x: x - left + window.pageXOffset,
      y: y - top + window.pageYOffset
    };
  }

  $.fn.colorPicker = function(background, select) {
    var canvas = this[0];
    var ctx = canvas.getContext('2d');

    var image = new Image();
    
    function drawCanvas() {
      var top = 0;
      var obj = canvas;
      while (obj !== null && obj.tagName !== 'BODY') {
        top += obj.offsetTop;
        obj = obj.offsetParent;
      }

      canvas.width = $(canvas).width();
      $(canvas).css('height', $(window).height() - top);
      canvas.height = $(canvas).height();
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    image.onload = drawCanvas;
    image.src = background;

    $(window).resize(drawCanvas);

    var mouseDown = false;
    this.bind('mousedown', function(evt) {
      mouseDown = true;
      getColor(evt.clientX, evt.clientY);
    });
    
    this.bind('mousemove', function(evt) {
      if (mouseDown) {
        getColor(evt.clientX, evt.clientY);
      }
    });

    this.bind('mouseup', function(evt) {
      mouseDown = false;
    });

    function touched(evt) {
      evt.stopPropagation();
      if (evt.targetTouches.length === 0) {
        var touch = evt.targetTouches[0];
        getColor(touch.pageX, touch.pageY);
      }
      evt.preventDefault();
    }

    this.bind('touchstart', touched);
    this.bind('touchmove', touched);

    function getColor(x, y) {
      var pos = getPos(canvas, x, y);
      if (pos !== null &&
          pos.x > 0 &&
          pos.x < canvas.width &&
          pos.y > 0 &&
          pos.y < canvas.height) {
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var relX = pos.x;
        var relY = pos.y;
        var red = data[((canvas.width * relY) + relX) * 4];
        var green = data[((canvas.width * relY) + relX) * 4 + 1];
        var blue = data[((canvas.width * relY) + relX) * 4 + 2];
        select({ r: red, g: green, b: blue });
      }
    }

    return this;
  };
}(jQuery));
