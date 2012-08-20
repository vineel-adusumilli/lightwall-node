lightwall
=========

lightwall is a web app that, along with [LightDuino](https://github.com/vineel-adusumilli/LightDuino), makes it easy to color the illuminated wall at [TinyFactory](http://tinyfactory.co/).

lightwall uses [socket.io](http://socket.io/) to connect to a color picker served to the browser. lightwall connects with LightDuino over a TCP connection and pushes RGB values as it recieves them from the browser. The end result is an interactive wall that can be controlled from multiple sources at once.

Usage
-----

Running lightwall is as easy as:

```bash
$ npm install
$ node main.js
```

There is also a `--no-static` option that only enables the Arduino TCP and socket.io servers.

