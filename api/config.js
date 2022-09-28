module.exports = {
  FRONTEND_URL: "http://localhost:3000",
  ROLE: {
    ARTIST: "artist",
    FAN: "fan",
  },
  COOKIE_OPTIONS: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 1000,
    // domain: "http://localhost:8080",
  },
  USER_BASIC_SELECTION: "id username avatar role",
  BACKEND_URL: "http://localhost:8080",
  IMAGE_COVER_TYPE: "IMAGE_TYPE",
  IMAGE_HOST_COVER_TYPE: "IMAGE_HOST_COVER_TYPE",
  AUDIO_TYPE: "ADUIO_TYPE",
  AUDIO_HOST_TYPE: "AUDIO_HOST_TYPE",
  FILE_TYPE: "FILE_TYPE",
  RADIO_BROWSER_API: "http://de1.api.radio-browser.info/json",
  NG_RADIO_RAPID_API_HOST: "nigeria-radio-stations.p.rapidapi.com",
  NG_RADIO_RAPID_API: "https://nigeria-radio-stations.p.rapidapi.com",
};
