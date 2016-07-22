var net = require('net');
var firmata = require('firmata');
var five = require('johnny-five');

var socketClient = null;
var firmataIO = null;
var board = null;

/* var for temperary cache */
var currentTemperature = 0.0;
var currentHumidity = 0.0;

// TCP連線設定
var options = {
  host: '192.168.31.105',  // IP of Arduino
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
        var multi = new five.Multi({
          controller: "HTU21D"
        });

        multi.on("change", function() {
          // acquire current humidity and temperature
          currentTemperature = this.temperature.celsius;
          currentHumidity = this.hygrometer.relativeHumidity;
        });

    });

  });
});
