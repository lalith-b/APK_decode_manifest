var fs = require('fs');
var SETTINGS = fs.readFileSync('./config/settings.json');
	SETTINGS = JSON.parse(SETTINGS);

var io = require('socket.io').listen(SETTINGS.port);

var chat = io
  .of('/chat')
  .on('connection', function (socket) {
    socket.emit('a message', {
        that: 'only'
      , '/chat': 'will get'
    });
    chat.emit('a message', {
        everyone: 'in'
      , '/chat': 'will get'
    });
  });

var news = io
  .of('/news')
  .on('connection', function (socket) {
    socket.emit('item', { news: 'item' });
  });
  
SocketProvider = function() {

};
