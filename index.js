const express = require('express');
const socket = require('socket.io');
var app = express();

var server = app.listen(4000, function() {
    console.log("Server is listening on port 4000");
});

app.use(express.static("public"));


var io = socket(server);

io.on("connection", function(socket) {
    console.log("::: server ::: onConnection")
    console.log("User Connected:" + socket.id);
    // 
    // Event name: join
    //
    socket.on('join', function(roomName) {
        var rooms = io.sockets.adapter.rooms;
        var room = rooms.get(roomName);
        
        // No room
        if (room == undefined) {
            socket.join(roomName);
            socket.emit("created");
            console.log("::: server ::: emit - created");
        
        // Has room
        } else if (room.size = 1) {
            socket.join(roomName);
            socket.emit("joined");
            console.log("::: server ::: emit - joined");

        } else {
            socket.emit("full");
            console.log("::: server ::: emit - full");
        }

        console.log(rooms);
    });

    // ::: SIGNALING SERVER 
    socket.on("ready", function (roomName) {
        console.log("::: server ::: onReady");
        console.log("::: server ::: emit - ready");
        socket.broadcast.to(roomName).emit("ready");
    })

    // candidate
    socket.on("candidate", function (candidate, roomName) {
        console.log("::: server ::: onCandidate");
        console.log("::: server ::: emit - candidate");
        socket.broadcast.to(roomName).emit("candidate", candidate);
    })

    // offer
    socket.on("offer", function (offer, roomName) {
        console.log("::: server ::: onOffer");
        console.log("::: server ::: emit - offer");
        socket.broadcast.to(roomName).emit("offer", offer);
    })

    // answer
    socket.on("answer", function (answer, roomName) {
        console.log("::: server ::: onAnswer");
        console.log("::: server ::: emit - answer");
        socket.broadcast.to(roomName).emit("answer", answer);
    })

});
