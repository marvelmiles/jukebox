const axios = require("axios");
const { RADIO_BROWSER_API } = require("./config");

axios.create({
  baseURL: RADIO_BROWSER_API,
});
