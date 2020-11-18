const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
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
    try {
      await axios.patch(
        `${BASE_URL}/user/${data.userId}`,
        { socketId: socket.id },
        {
          headers: {
            Authorization: data.jwt,
          },
        },
      );
    } catch (err) {
      console.log("ERROR MEDICO");
    }
    if (interval) clearInterval(interval);
    interval = setInterval(() => getter(socket, data, true), 2000);
  });
  socket.on("patient", async (data) => {
    try {
      await axios.patch(
        `${BASE_URL}/user/${data.userId}`,
        { socketId: socket.id },
        {
          headers: {
            Authorization: data.jwt,
          },
        },
      );
    } catch (error) {
      console.log("ERROR PACIENTE");
    }
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

      if (rec.socketId) {
        console.log(rec.socketId);
        console.log("SE ENVIO EL MENSAJE");
        socket.to(rec.socketId).emit("receiveMessage", { message: data.message, idEmisor: data.userId, date: new Date(), idUnico: uuidv4() });
      } else {
        console.log(`el usuario ${rec.name} esta desconectado`);
      }
    } catch (error) {
      console.log("ERROR DE SENDMESSAGE");
    }
  });

  socket.on("leido", async (data) => {
    console.log("NOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
    console.log(data);
    console.log("NOOOOOOOOOOOOOOOOOOOOOOOOOOOO");
    let response = await axios.get(`${BASE_URL}/messages/viewed/${data.idEmisor}/${data.idReceptor}/${data.rol}`).then((res) => {
      console.log("RES DATA");
      console.log(res.data);
      return res.data;
    });
    console.log("RESPONSE");
    console.log(response);
    if (response.socketId) {
      console.log("SE ENVIO LEIDO");
      socket.to(response.socketId).emit("leer", { id: data.idReceptor });
    } else {
      console.log(`el usuario ${response.name} esta desconectado`);
    }
  });

  socket.on("disconnect", async () => {
    console.log(`Client disconnected ${socket.id}`);
    clearInterval(interval);
    try {
      await axios.delete(`${BASE_URL}/user/socket/${socket.id}`);
    } catch (error) {
      console.log("ERROR DE DISCONNECT SEC");
    }
  });
});

server.listen(PORT || 5000, () => {
  console.log(`Servidor escuchando por el puerto ${PORT}`);
});
