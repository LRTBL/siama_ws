if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

module.exports = {
  PORT: process.env.PORT,
  BASE_URL: "https://siamaapi2-mgz4ro726a-ue.a.run.app/v1/api",
};
