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

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(server, {});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);

// The 'info' object stores most of the information about our rooms. It contains a sub-object for each room which contains
// the password and admin if applicable, the users inside, the banned users, whether or not it is an explicit room, and
// who in the room is currently typing. We start off with just the "Main Room"
let info = { "Main Room": { password: null, admin: null, users: [], banned_users: {}, explicit: false, typing: [] } };

// The 'ids' object is for private messaging
let ids = {};

// This is a list of the profane language not allowed in our non-explicit rooms. When a message is sent, these words are filtered
// out. These terms were selected from the list of YouTube blacklisted words
let profanity = ["asshole", "bitch", "bloody", "bollocks", "bugger", "bullshit", "pussy", "cock", "cunt", "dick", "fuck", "motherfucker", "shit"];

// We use this to ensure that the profanity is counted not jsut for lowercase letters
if (profanity.length < 15) {
    console.log("here at least");
    let len = profanity.length;
    for (let i = 0; i < len; i++) {
        let this_one = profanity[i];
        profanity.push(this_one.toUpperCase());
        profanity.push(this_one.charAt(0).toUpperCase() + this_one.substring(1));
    }
}

// This will run when a new user connects to the server
io.sockets.on("connection", function(socket) {
    // This will run if a user successfully logs into the server and put them into "Main Room"
    socket.on('join_server', function(data) {
        socket.join(data.room);
        console.log(data.user + " connected");
        socket.this_user = data.user;
        socket.curr_room = data.room;
        info[data.room].users.push(data.user);
        ids[data.user] = socket.id;
        console.log(ids);
        io.sockets.emit("get_users", info);
    });

    // This will run if the user disconnects, taking them out of 'info' entirely
    socket.on("disconnect", function() {
        if (socket.this_user) {
            console.log("Users before:");
            console.log(info);
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

    // This allows the client-side code to reference the 'info' object containing all users
    socket.on('get_users', function() {
        io.sockets.emit("get_users", info);
    });

    // This creates a room, adding it to 'info' and setting the password if applicable.
    // It also adds the user who creates it to the room, and this user will be set as the
    // admin in the next function
    socket.on('create', function(data) {
        info[data.room_name] = { password: null, admin: null, users: [], banned_users: {}, typing: [], explicit: data.explicit };

        if (data.password != "") {
            info[data.room_name].password = data.password;
        }
        socket.join(data.room_name);

        io.sockets.emit("get_users", info)
    });

    // This will switch a user to another room
    socket.on('switch_room', function(data) {
        // This will only print if the data was sent improperly
        if (!data.old_room || !data.room_name) {
            console.log(data);
            return;
        }

        // This adds the user to the room so that they can only see/send messages in the correct room
        socket.join(data.room_name);

        // If there's no admin, then the current room is either the "Main Room" or the user just created
        // the room; if this is the case, we set the admin to the current user
        let us = data.user;
        if (!info[data.room_name].admin && data.room_name != "Main Room") {
            info[data.room_name].admin = us;
        }
        io.sockets.emit("get_users", info);

        console.log(us + " is leaving " + data.old_room + " and joining " + data.room_name);
        info[data.old_room].users = info[data.old_room].users.filter(item => item !== us);
        socket.leave(data.old_room);
        if (data.room_name && !info[data.room_name].users.includes(us)) {
            info[data.room_name].users.push(us);
            socket.curr_room = data.room_name;
        }
        io.sockets.emit("get_users", info);
    });

    // This will run if a user is typing, and will add that user to the typing array within the 
    // current room sub-object
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

    // This will run if a user stops typing, and will remove that user from the typing array within
    // the current room sub-object
    socket.on('typing_off', function(data) {
        let room = data.room;
        info[room].typing = info[room].typing.filter(item => item !== data.user);

        io.in(room).emit('typing_off', info[room].typing);
        console.log(data.user + "'s no longer typing");
        console.log(info[room].typing);
    });

    // This will run if a user sends a private message to another user
    socket.on('private_message', function(data) {
        console.log(data);
        id_receiver = ids[data.receiver];
        id_sender = ids[data.sender];
        private_ids = [id_receiver, id_sender];
        io.in(private_ids).emit("p_message", data);

        console.log("the id of the receiver is " + id_receiver);
    });

    // This will run if the user attempts to get into a password-protected room,
    // and will send back 'true' or 'false' in the 'correct' field
    socket.on("pass_attempt", function(data) {
        console.log(data);
        if (info[data.next_room] && info[data.next_room].password) {
            let real_pass = info[data.next_room].password;
            let correct = real_pass == data.pass;
            console.log(correct);
            io.sockets.emit("pass_attempt", { correct: correct, next_room: data.next_room });
        }
    });

    // This will simply return the list of room names
    socket.on("get_rooms", function() {
        let all_rooms = Object.keys(info);
        socket.emit("get_rooms", all_rooms);
    })


    // This will run whenever a message is sent from a user
    socket.on('message_to_server', function(data) {
        console.log(data);
        let m = data.message;
        let room = data.room;

        // Here we check if the room is non-explicit and, if so, we filter out explicit language
        if (!info[room].explicit) {
            for (let i = 0; i < profanity.length; i++) {
                let prof = profanity[i];
                if (m.includes(prof)) {
                    m = m.replace(prof, prof.substring(0, 1) + "-".repeat(prof.length - 1));
                }
            }
            data.message = m;
        }

        // Now we'll send the message back to the client, edited if necessary
        io.in(room).emit("message_to_client", data);
    });

    // This function is to determine if the current user is the admin of the room they're in
    socket.on("isAdmin", function(data) {
        let thing = data.user == info[data.room].admin;
        socket.emit("isAdmin", { room_name: data.room, is_admin: thing, info: info[data.room] });
    });

    // This function will ban a user from a room
    socket.on("ban_user", function(data) {
        info[data.room].banned_users[data.other_user] = [data.timestamp, data.duration];
        banned_user = data.other_user;
        banned_user_id = []
        banned_user_id.push(ids[banned_user]);
        io.in(banned_user_id).emit("ban_user", { banned_room: data.room });
    });

    // This will check if a user is banned from a room
    socket.on("isBanned", function(data) {
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