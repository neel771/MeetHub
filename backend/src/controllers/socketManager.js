import { Server } from "socket.io";


let connections = {};
let messages = {};
let timeOnline = {};
let userNames = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {

    console.log(`connected`);

    //join-call event handle Logic

    socket.on("join-call", ({ path, username }) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      userNames[socket.id] = username || "Guest";
      timeOnline[socket.id] = new Date();

      const participantData = connections[path].map((socketId) => ({
        socketId,
        username: userNames[socketId] || "Guest"
      }));

      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          participantData
        );
      }

      if (messages[path] !== undefined) {
        //Agar iss room ke purane messages saved hain, to next steps chalao.
        for (let a = 0; a < connections[path].length; a++) {
          //Room ke har message ko ek-ek kar ke naya join hone wale user ko bhejo.
          io.to(socket.id).emit(
            //Naye user ko ek-ek purana message emit kar do.
            "chat-message",
            messages[path][a]["data"], // Yeh message ka content hai.
            messages[path][a]["sender"], //Message kisne bheja tha (username)
            messages[path][a]["socket-id-sender"] //Message kis socket id se aaya tha.
          );
        }
      }
    });
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });
    //Signal event ek user ka WebRTC data dusre user ko bhejne ke liye hota hai.
    //A → Server → B, B → Server → A


    //chat-msg event handle Logic

    socket.on("chat-message", (data, sender) => {

      const [matchingRoom, found] = Object.entries(connections)
        .reduce(([room, isFound], [roomKey, roomValue]) => {


          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];

        }, ['', false]);

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = []
        }

        messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
        console.log("message", matchingRoom, ":", sender, data)

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id)
        })
      }

    })


    //disconnect event handle Logic

    socket.on("disconnect", () => {
      var diffiTime = Math.abs(timeOnline[socket.id] - new Date());

      var Key

      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            Key = k

            for (let a = 0; a < connections[Key].length; ++a) {
              io.to(connections[Key][a]).emit("user-left", socket.id);
            }

            delete userNames[socket.id];

            var index = connections[Key].indexOf(socket.id);

            connections[Key].splice(index, 1);

            if (connections[Key].length === 0) {
              delete connections[Key];
            }
          }
        }
      }
    });
  });
  return io;
};

export default connectToSocket;