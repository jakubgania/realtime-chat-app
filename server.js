const path = require('path');
const http = require('http');
const express = require('express');
const socketio =  require('socket.io');
const formatMessages = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'chat bot';

// run when client connections
io.on('connection', socket => {
  console.log('new websocket connection...');

  socket.on('joinRoom', ({username, room}) => {
    const user = userJoin(socket.id, username, room)

    socket.join(user.room);

    // welcome current user
    socket.emit('message', formatMessages(botName, 'welcome to chat'));

    //broadcast when a user connects
    socket.broadcast.to(user.room).emit(
      'message',
      formatMessages(botName, `${user.username} user has joined the chat`)
    );

    // send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // listen for chat message
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessages(user.username, msg));
  });

  // runs when clinet disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit('message', formatMessages(botName, `${user.username} user has left the chat`));

      // send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, '192.168.0.13', () => console.log(`Server running on port ${PORT}`));