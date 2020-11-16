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
  res.send({ response: "WebSocket siama DevOps" }).status(201);
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

  // userId
  // jwt
  // receptorId
  // message
  // rol

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

  socket.on("sendMessage", async (data) => {
    console.log(data);
    try {
      let rec = await axios
        .get(`${BASE_URL}/user/${data.receptorId}`, {
          headers: {
            Authorization: data.jwt,
          },
        })
        .then(async (receptor) => {
          await axios.post(`${BASE_URL}/messages`, {
            idPatient: data.role === "patient" ? data.userId : data.receptorId,
            idMedical: data.role === "patient" ? data.receptorId : data.userId,
            message: data.message,
            send: data.role === "patient" ? 1 : 0,
          });
          return receptor.data;
        });
      console.log(rec.socketId);
      if (rec.socketId) {
        socket.broadcast.to(rec.socketId).emit("recibeMessage", { message: data.message, idEmisor: data.userId, date: new Date() });
      } else {
        console.log(`el usuario ${rec.name} esta desconectado`);
      }
    } catch (error) {
      console.log("ERROR DE SENDMESSAGE");
    }
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected ${socket.id}`);
    try {
      await axios.delete(`${BASE_URL}/user/socket/${socket.id}`);
    } catch (error) {
      console.log("ERROR DE DISCONNECT SEC");
    }
    clearInterval(interval);
  });
});

server.listen(PORT || 5000, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});
