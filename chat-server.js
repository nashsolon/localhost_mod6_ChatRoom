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
        socket.join(data.room);
        console.log(data.user + " connected");
        socket.this_user = data.user;
        socket.curr_room = data.room;
        users[data.room].push(data.user);
        io.sockets.emit("get_users", users);
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
        // io.sockets.emit("add_to_roomlist", data);
        io.sockets.emit("get_users", users)
    });

    socket.on('switch_room', function(data) {
        // This callback runs when the server receives a new message from the client.

        // console.log("message: " + data["message"]); // log it to the Node.JS output
        // if (data.pass_value == false) {
        if (!data.old_room || !data.room_name) {
            console.log("Bad\n-----");
            console.log(data);
            return;
        }

        socket.join(data["room_name"]);
        let us = data.user;

        console.log(us + " is leaving " + data.old_room + " and joining " + data.room_name);
        users[data.old_room] = users[data.old_room].filter(item => item !== us);
        if (data.room_name) {
            users[data.room_name].push(us);
            socket.curr_room = data.room_name;
        }
        // } else {
        //     password = users[data.room_name][1];
        //     console.log("The password is " + password);
        //     socket.emit('enter_password', {
        //         password: password,

        //     });
        // }
        // // console.log("The room you joined is: " + data["room_name"]);
        io.sockets.emit("get_users", users);
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
    });

    socket.on("pass_attempt", function(data) {
        // .pass, .room
        // console.log("Pass: " + data.pass + ", Room: " + data.room);
        // console.log("Pass is " + data.pass);
        console.log(data);
        if (users[data.next_room][0] == "") {
            let real_pass = users[data.next_room][1];
            let correct = real_pass == data.pass;
            console.log(correct);
            io.sockets.emit("pass_attempt", {correct: correct, next_room: data.next_room});
        }
    });

    socket.on("get_rooms", function() {
        let all_rooms = Object.keys(users);
        socket.emit("get_rooms", all_rooms);
    })


    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function(data) {
        console.log(data);

        // This callback runs when the server receives a new message from the client.

        // console.log("message: " + data["message"]); // log it to the Node.JS output
        // console.log(data.user);

        io.in(data.room_name).emit("message_to_client", data); // broadcast the message to other users
    });
});
// io.sockets.on("disconnect", function() {

// });