// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const file = "client.html";
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, res) {
    // This callback runs when a new connection is made to our HTTP server.

    fs.readFile(file, function (err, data) {
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

    


io.sockets.on("connection", function (socket) {
    socket.on('create', function(room) {
        socket.join(room);
        io.sockets.emit("create_room", { message: room["message"] })
        console.log("New room name: " + room["room_name"]);
    });
    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.

        console.log("message: " + data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", { message: data["message"] }) // broadcast the message to other users
    });
});