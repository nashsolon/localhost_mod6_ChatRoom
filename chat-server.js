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


let info = { "Main Room": { password: null, admin: null, users: [], banned_users: {}, typing: [] } };
let ids = {};
let explicit_users = {};
let profanity = ["asshole", "bitch", "bloody", "bollocks", "bugger", "bullshit", "pussy", "cock", "cunt", "dick", "fuck", "motherfucker", "shit"];

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
        info[data.room].users.push(data.user);
        console.log("So you want explicit to be " + data.explicit);
        

        
        ids[data.user] = socket.id;
        console.log(ids);
        io.sockets.emit("get_users", info);
    });

    socket.on("disconnect", function() {
        if (socket.this_user) {
            // let index = users[socket.curr_room].indexOf(socket.this_user);
            console.log("Users before:");
            console.log(info);
            // console.log("Remove at index " + index);
            // users[socket.curr_room] = users[socket.curr_room].splice(index, 1);
            if (info[socket.curr_room]) {
                info[socket.curr_room].users = info[socket.curr_room].users.filter(item => item !== socket.this_user)
            }
            if (info[socket.curr_room].typing.includes(socket.this_user)) {
                info[socket.curr_room].typing = info[socket.curr_room].typing.filter(item => item !== socket.this_user);
                io.in(socket.curr_room).emit('typing_off', info[socket.curr_room].typing);
            }
            console.log(info);
            console.log(socket.this_user + " disconnected");
            io.sockets.emit("update_users", info);
        }

    })

    socket.on('get_users', function() {
        io.sockets.emit("get_users", info);
    });

    socket.on('create', function(data) {
        // data.room_name = String(data.room_name);
        info[data.room_name] = { password: null, admin: null, users: [], banned_users: {}, typing: [], explicit: false};

        if (data.explicit == true){
            info[data.room_name].explicit == true;
        }

        if (data.password != "") {
            // users[data.room_name].push("");
            info[data.room_name].password = data.password;
        }
        socket.join(data.room_name);


        // console.log("The room you joined is: " + data["room_name"]);
        // io.sockets.emit("add_to_roomlist", data);
        io.sockets.emit("get_users", info)
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

       
        let us = data.user;
        if (!info[data.room_name].admin && data.room_name != "Main Room") {
            info[data.room_name].admin = us;
        }
        if (us == info[data.room_name].admin) {
            console.log("You are the admin in the room " + data.room_name);
            socket.emit("admin", info);
        }
        // admin = users[data.room_name]
        io.sockets.emit("get_users", info);


        console.log(us + " is leaving " + data.old_room + " and joining " + data.room_name);
        info[data.old_room].users = info[data.old_room].users.filter(item => item !== us);
        socket.leave(data.old_room);
        if (data.room_name && !info[data.room_name].users.includes(us)) {
            info[data.room_name].users.push(us);
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
        console.log(info);
        io.sockets.emit("get_users", info);
    });

    // typing = "";

    socket.on('typing', function(data) {
        let room = data.room;
        let user = data.user;
        if (!info[room].typing.includes(user)) {
            info[room].typing.push(user);
            io.in(room).emit("typing", info[room].typing);
            console.log(user + "'s typing...");
            console.log(info[room].typing);
        }
    });

    socket.on('typing_off', function(data) {
        // if (username == typing) {
        //     typing = "";
        let room = data.room;
        info[room].typing = info[room].typing.filter(item => item !== data.user);

        io.in(room).emit('typing_off', info[room].typing);
        console.log(data.user + "'s no longer typing");
        console.log(info[room].typing);
        // }
    });

    socket.on('private_message', function(data) {
        console.log(data);
        id_receiver = ids[data.receiver];
        id_sender = ids[data.sender];
        private_ids = [id_receiver, id_sender];
        //console.log("the id of the receiver is " + id_receiver);
        io.in(private_ids).emit("p_message", data);

        console.log("the id of the receiver is " + id_receiver);
    });
    socket.on("pass_attempt", function(data) {
        // .pass, .room
        // console.log("Pass: " + data.pass + ", Room: " + data.room);
        // console.log("Pass is " + data.pass);
        console.log(data);
        if (info[data.next_room] && info[data.next_room].password) {
            let real_pass = info[data.next_room].password;
            let correct = real_pass == data.pass;
            console.log(correct);
            io.sockets.emit("pass_attempt", { correct: correct, next_room: data.next_room });
        }
    });

    socket.on("get_rooms", function() {
        let all_rooms = Object.keys(info);
        socket.emit("get_rooms", all_rooms);
    })


    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function(data) {
        console.log(data);
        let m = data.message;
        let room = data.room;
        // This callback runs when the server receives a new message from the client.

        // console.log("message: " + data["message"]); // log it to the Node.JS output
        // console.log(data.user);
        console.log("The room you are in is explicit: " + info[room].explicit)
        if (info[room] && !info[room].explicit) {
            // do stuff to m
            for (let i = 0; i < profanity.length; i++) {
                let prof = profanity[i];
                if (m.includes(prof)) {
                    console.log("Includes " + prof);
                    m = m.replace(prof, prof.substring(0, 1) + "-".repeat(prof.length - 1));
                    // m = m.replace(prof, "");
                }
            }
            console.log(data);
            console.log(m);
            data.message = m;
            console.log(data);
        }
        // This callback runs when the server receives a new message from the client.

        // console.log("message: " + data["message"]); // log it to the Node.JS output
        // console.log(data.user);

        io.in(room).emit("message_to_client", data); // broadcast the message to other users
    });

    socket.on("isAdmin", function(data) {
        // console.log("Is " + data.user + " the admin???????");
        let thing = data.user == info[data.room].admin;
        // console.log(thing + ": He is " + data.user + ", admin is " + info[data.room].admin);
        socket.emit("isAdmin", { room_name: data.room, is_admin: thing, info: info[data.room] });
    });

    // Stanley's: {banned_users: {nash: ["12-14-21 3-28"], [-1]}}
    socket.on("ban_user", function(data) {
        info[data.room].banned_users[data.other_user] = [data.timestamp, data.duration];
        //console.log(info[data.room]);
        banned_user = data.other_user;
        banned_user_id = []
        banned_user_id.push(ids[banned_user]); //Why does ids.banned_user not work in this instance???
        console.log("The user you want to ban has username of " + data.other_user + " and ID of " + banned_user_id);
        console.log(banned_user_id);
        io.in(banned_user_id).emit("ban_user", {banned_room: data.room});
    });

    socket.on("isBanned", function(data) {
        // data.user, data.room
        let banned = false;
        if (data.user in info[data.room].banned_users) {
            let curr_time = new Date().getTime();
            let dur = info[data.room].banned_users[data.user][1];
            let timestamp = info[data.room].banned_users[data.user][0]
            if (dur == -1) {
                console.log(data.user + " is permanently banned from " + data.room);
                banned = true;
            } else {
                let diff = curr_time - timestamp;
                if (diff > dur) {
                    console.log(data.user + " is no longer banned from " + data.room);
                    delete info[data.room].banned_users[data.user];
                } else {
                    console.log(data.user + " is still banned for " + (dur - diff) + " more millisecs");
                    banned = true;
                }
            }
        }
        socket.emit("isBanned", { banned: banned })
    });

});