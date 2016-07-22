var net = require('net');
var firmata = require('firmata');
var five = require('johnny-five');
var socketIO = require('socket.io-client')('SOCKET.IO_SERVER_URL');

var socketClient = null;
var firmataIO = null;
var board = null;
var led = null;

/* var for temperary cache */
var currentTemperature = 0.0;
var currentHumidity = 0.0;

// TCP連線設定
var options = {
  host: 'YOUR_ARDUINO_IP',  // IP of Arduino
  port: 5055  //任意的port，但必需和你設在 /etc/ser2net.conf 的port要一致
};

/* Connect to linino */
var client = net.connect(options);

// connect to ser2net
client.on('connect', function(){
  console.log("connected to server!");
  socketClient = this;

  // connect to Arduino with firmata
  firmataIO = new firmata.Board(socketClient, function(err) {
    if (err) {
      console.log("error: " + err);
      return;
    }
  });

  // when connect with firmata
  firmataIO.once("ready", function(){
    console.log("firmata over TCP is ready");

    // Use firmata as an IO for Johnny-Five
    board = new five.Board({io: firmataIO});

    board.on('ready', function(){
        console.log('johnny-five is ready');

        led = five.Led(13);
        var multi = new five.Multi({
          controller: "HTU21D"
        });

        multi.on("change", function() {
          // acquire current humidity and temperature
          currentTemperature = this.temperature.celsius;
          currentHumidity = 100 + this.hygrometer.relativeHumidity;
        });

    });

  });
});

/* socket.IO */
socketIO.on('connect', function(){
  console.log("Connected to Socket.IO server");
});

/* led event */
socketIO.on('led_on', function() {
  if(led) { led.on(); }

});

socketIO.on('led_off', function() {
  if(led) { led.off(); }
});

socketIO.on('led_blink', function() {
  if(led) { led.blink(300); }
});

// return corresponding values of sensor
socketIO.on('query', function(field, fn){
  switch (field) {
    case 'temp':
      fn(currentTemperature);
      break;
    case 'humid':
      fn(currentHumidity);
      break;
    case 'all':
      var data = new Object();
      data.temp = currentTemperature;
      data.humid = currentHumidity;
      fn(data);
      break;
    default:
      fn(null);
  }
});
