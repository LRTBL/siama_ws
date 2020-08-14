const express = require("express");
const app = express();
const server = require("http").createServer(app);
const socketio = require("socket.io");
const axios = require("axios");
const io = socketio(server);
const { PORT } = require("./config");
let interval;

app.get("/", (req, res) => {
  res.send({ response: "WebSocket siama" }).status(201);
});

io.on("connection", (socket) => {
  console.log("New client connected " + socket.id);

  socket.on("getUsers", (jwt) => {
    if (interval) {
      clearInterval(interval);
    }
    interval = setInterval(() => getApiAndEmit(socket, jwt), 1000);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getApiAndEmit = (socket, jwt) => {
  axios
    .get("https://siama-node-js.herokuapp.com/v1/api/user", {
      headers: {
        Authorization: jwt,
      },
    })
    .then((result) => {
      socket.emit("recibeUser", result.data);
    })
    .catch((err) => {
      console.log(err);
    });
};

server.listen(PORT, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});
