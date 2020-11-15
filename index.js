const express = require("express");
const app = express();
const server = require("http").createServer(app);
const socketio = require("socket.io");
const axios = require("axios");
const io = socketio(server);
const { PORT, BASE_URL } = require("./config");
const { getter } = require("./utils");
let interval;

app.get("/", (req, res) => {
  res.send({ response: "WebSocket siama" }).status(201);
});

io.on("connection", (socket) => {
  console.log("New client connected " + socket.id);

  socket.on("admin", async (data) => {
    await axios.patch(
      `${BASE_URL}/user/${data.userId}`,
      { socketId: socket.id },
      {
        headers: {
          Authorization: data.jwt,
        },
      },
    );
    if (interval) clearInterval(interval);
    interval = setInterval(() => getter(socket, data, true), 2000);
  });

  socket.on("patient", async (data) => {
    await axios.get(
      `${BASE_URL}/user/${data.userId}`,
      { socketId: socket.id },
      {
        headers: {
          Authorization: data.jwt,
        },
      },
    );
    if (interval) clearInterval(interval);
    interval = setInterval(() => getter(socket, data), 2000);
  });

  socket.on("sendMessagePatient", async (data) => {
    let receptor = await axios.get(`${BASE_URL}/user/${data.receptorId}`, {
      headers: {
        Authorization: data.jwt,
      },
    });
    await axios.post(`${BASE_URL}/messages`, {
      idPatient: data.rol === "patient" ? data.userId : receptor._id,
      idMedical: data.rol === "patient" ? receptor._id : data.userId,
      message: data.message,
      send: data.rol === "patient" ? 1 : 0,
    });
    socket.broadcast.to(receptor.socketId).emit("recibeMessage", { message: data.message, idEmisor: data.userId });
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected ${socket.id}`);
    socket.broadcast.emit("user_disconnect", { message: "Se desconecto un usario", idUser: socket.id });
    try {
      await axios.delete(`${BASE_URL}/user/socket/${socket.id}`);
    } catch (error) {
      console.log(error);
    }
    clearInterval(interval);
  });
});

server.listen(PORT || 5000, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});
