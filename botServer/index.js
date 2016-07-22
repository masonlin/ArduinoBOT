var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var request = require('request');

var activeSocket = null;
var arduinoReady = false;

const fan_page_tokn = "YOUR_FAN_PAGE_TOKEN";

app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/* socket IO */
io.on('connection', function(socket){
  activeSocket = socket;
  console.log(socket.id + " connected");
  socket.on('message', function(msg){
    console.log(msg);
  });

  socket.on('arduino_ready', function(){
    arduinoReady = true;
  });
});

io.on('disconnect', function(socket) {
  arduinoReady = false;
});

/* Messneger endpoints */

// Authentication
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === "THIS_IS_ARDUINO_BOT_VERIFY_TOKEN") {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

// Handle messages
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;
      console.log("Received from page id: " + pageID + " at " + timeOfEvent);

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.optin) {
          console.log("optin");
          receivedAuthentication(messagingEvent);
        } else if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else {
          console.log("Webhook received unknown messagingEvent: ", messagingEvent);
        }
      });
    });

    // must send back 200
    res.sendStatus(200);
  }
});

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to
 * Messenger" plugin, it is the 'data-ref' field. Read more at
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfAuth = event.timestamp;

  // The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
  // The developer can set this to an arbitrary value to associate the
  // authentication callback with the 'Send to Messenger' click event. This is
  // a way to do account linking when the user clicks the 'Send to Messenger'
  // plugin.
  var passThroughParam = event.optin.ref;

  console.log("Received authentication for user %d and page %d with pass " +
    "through param '%s' at %d", senderID, recipientID, passThroughParam,
    timeOfAuth);

  // When an authentication is received, we'll send a message back to the sender
  // to let them know it was successful.
  sendTextMessage(senderID, "Authentication successful");
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    console.log('message:' + messageText);
    if (messageText.indexOf("開燈") >= 0) {
      activeSocket.emit('led_on');
      sendTextMessage(senderID, "好的，我將您點燈");
      return;
    }

    if (messageText.indexOf("關燈") >= 0) {
      activeSocket.emit('led_off');
      sendTextMessage(senderID, "我為您將燈熄滅");
      return;
    }

    if (messageText.indexOf("氣氛") >= 0) {
      activeSocket.emit('led_blink');
      sendTextMessage(senderID, "好的，我來把這裡弄high一點");
      return;
    }

    if(messageText.indexOf("溫") >= 0 || messageText.indexOf("溼") >= 0) {
      activeSocket.emit('query', 'all', function(data) {
        var temp = data.temp;
        var humid = data.humid;
        sendTextMessage(senderID, "現在是 " + temp + " 度，相對濕度 " + humid + "%");
        return;
      });
    }

  }
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: fan_page_tokn },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}




/* http server */
http.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
