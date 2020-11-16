const axios = require("axios");
const { BASE_URL } = require("../config");

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
    let users = await axios.get(`${BASE_URL}/user`, {
      headers: {
        Authorization: jwt,
      },
    });
    return users.data;
  } catch (e) {
    console.log(e);
  }
};

const getDniAndEmit = async (data) => {
  try {
    let user = await axios.get(`${BASE_URL}/user/${data.userId}`, {
      headers: {
        Authorization: data.jwt,
      },
    });
    return user.data;
  } catch (e) {
    console.log(e);
  }
};

module.exports = { getter };
