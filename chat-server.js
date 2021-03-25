// Require the packages we will use:
const http = require("http"),
    fs = require("fs");
mine = require("mime");

const port = 3456;
const file = "client.html";
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function(req, res) {
    // This callback runs when a new connection is made to our HTTP server.

    fs.readFile(file, function(err, data) {
        // This callback runs when the client.html file has been read from the filesystem.

        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);
    });
});
server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(server, {

});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);

//Server side creating a new room


let users = { "Main Room": [] };

// "Main Room": ["sasha", "max"], "Stupid Room": ["nash"];

io.sockets.on("connection", function(socket) {
    console.log("Connected!");
    // let this_user = "";
    // let curr_room = "";

    socket.on('join_server', function(data) {
        console.log(data.user + " connected");
        socket.this_user = data.user;
        socket.curr_room = data.room;
        users[data.room].push(data.user);
        io.sockets.emit("update_users", users);
    });

    socket.on("disconnect", function() {
        if (socket.this_user) {
            // let index = users[socket.curr_room].indexOf(socket.this_user);
            console.log("Users before:");
            console.log(users);
            // console.log("Remove at index " + index);
            // users[socket.curr_room] = users[socket.curr_room].splice(index, 1);
            if (users[socket.curr_room]) {
                users[socket.curr_room] = users[socket.curr_room].filter(item => item !== socket.this_user)
            }
            console.log(users);
            console.log(socket.this_user + " disconnected");
            io.sockets.emit("update_users", users);
        }

    })

    socket.on('get_users', function() {
        io.sockets.emit("get_users", users);
    });

    socket.on('create', function(data) {
        // data.room_name = String(data.room_name);
        users[data.room_name] = [];

        if (data.password != "") {
            users[data.room_name].push("");
            users[data.room_name].push(data.password);
        }
        socket.join(data.room_name);

        // console.log("The room you joined is: " + data["room_name"]);
        io.sockets.emit("add_to_roomlist", data);
    });

    socket.on('switch_room', function(data) {
        // This callback runs when the server receives a new message from the client.

        // console.log("message: " + data["message"]); // log it to the Node.JS output
        socket.join(data["room_name"]);
        let us = data.user;

        console.log(us + " is leaving " + data.old_room + " and joining " + data.room_name);
        users[data.old_room] = users[data.old_room].filter(item => item !== us);
        if (data.room_name) {
            users[data.room_name].push(us);
            socket.curr_room = data.room_name;
        }
        // console.log("The room you joined is: " + data["room_name"]);

    });

    typing = "";

    socket.on('typing', function(username) {
        if (typing == "") {
            typing = username;
            socket.broadcast.emit('typing', username);
        }
    });

    socket.on('typing_off', function(username) {
        if (username == typing) {
            typing = "";
            socket.broadcast.emit('typing_off');
        }
    })

    socket.on('create', function(room) {
        socket.join(room);
        io.sockets.emit("create_room", { message: room["message"] });
        console.log("New room name: " + room["room_name"]);
    });
    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function(data) {
        console.log(data);
        // This callback runs when the server receives a new message from the client.

        // console.log("message: " + data["message"]); // log it to the Node.JS output
        // console.log(data.user);
        io.sockets.emit("message_to_client", data); // broadcast the message to other users
    });
});
// io.sockets.on("disconnect", function() {

// });