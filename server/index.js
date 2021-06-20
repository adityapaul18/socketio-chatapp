const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors")
const {adduser , getuser , getuserinroom , removeuser} = require('./users.js') 
const port = process.env.port || 5000;
const router= require('./router');
const app=express();
app.use(cors());

const server=http.createServer(app);
const io = socketio(server,{
    cors:{
        origin: "*",
    },
});

app.use(router);

io.on("connect", (socket) => {
    socket.on('join', ({name,room},callback) =>{
       const {error,user} = adduser({id : socket.id , name ,  room});

       if(error) return callback(error);
       socket.join(user.room);

       socket.emit('message' , {user:'admin' ,  text: `${user.name} ,  welcome to the room ${user.room}`});
       socket.broadcast.to(user.room).emit('message', {user: 'admin' ,  text : `${user.name}, has joined`})
       io.to(user.room).emit('roomData', { room: user.room, users: getuserinroom(user.room) });
       callback();
    })

    socket.on('sendMessage',(message,callback) => {
        const user = getuser(socket.id)
        // console.log(message.message  , message.room)
        
        io.to(user.room).emit('message' , {user: user.name ,  text : message});
        console.log(user.name , message) 

        callback();  
    });


    socket.on("disconnect",() =>  {
        const user = removeuser(socket.id);
        if(user) {
            io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
            io.to(user.room).emit('roomData', { room: user.room, users: getuserinroom(user.room)});
          }
        })
})

server.listen(port , () => console.log(`server has started on port ${port}`)) 