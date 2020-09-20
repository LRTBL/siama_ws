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
  socket.on("admin", (data) => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => getter(socket, data, true), 10000);
  });
  socket.on("patient", (data) => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => getter(socket, data), 10000);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

const getter = async (socket, data, flag = false) => {
  const newData = {};
  let user = await getDniAndEmit(data);
  newData.user = user;
  if (flag) {
    newData.users = await getUsersAndEmit(data.jwt);
  }
  socket.emit("getData", newData);
};

const getUsersAndEmit = async (jwt) => {
  try {
    let users = await axios.get(
      "https://siama-node-js.herokuapp.com/v1/api/user",
      {
        headers: {
          Authorization: jwt,
        },
      },
    );
    return users.data;
  } catch (e) {
    console.log(e);
  }
};

const getDniAndEmit = async (data) => {
  try {
    let user = await axios.get(
      `https://siama-node-js.herokuapp.com/v1/api/user/dni/${data.user}`,
      {
        headers: {
          Authorization: data.jwt,
        },
      },
    );
    return user.data;
  } catch (e) {
    console.log(e);
  }
};

server.listen(PORT, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});
