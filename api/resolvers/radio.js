const { isObjectIdOrHexString } = require("mongoose");
const axios = require("axios");
const {
  RADIO_BROWSER_API,
  NG_RADIO_RAPID_API,
  NG_RADIO_RAPID_API_HOST,
} = require("../config");
const {
  getRadioBasics,
  fromObjectID,
  getLocation,
  getAllRadios,
  runParallel,
} = require("../helpers");
const { ObjectId } = require("mongodb");
const { UserInputError } = require("apollo-server-core");
const fs = require("fs");
const path = require("path");
const request = require("request");
module.exports = {
  Query: {
    async getRadios(_, { limit = 100000, offset = 0, country, city, query }) {
      try {
        //console.log("getting radios...");
        if (!country) {
          country = await getLocation();
          city = city || country.city;
          country = country.country;
        }
        country = country.toLowerCase();
        city = city.toLowerCase();
        // country = "ghana";

        if (query) {
          query = query.toLowerCase();
          const radios = [];
          for (let radio of await getAllRadios()) {
            if (
              (radio.name || radio.radio_name || "")
                .toLowerCase()
                .indexOf(query) >= 0 ||
              (
                radio.url_resolved ||
                radio.url ||
                radio.urlCache ||
                radio.radio_url ||
                ""
              )
                .toLowerCase()
                .indexOf(query) >= 0 ||
              (radio.country || "").toLowerCase().indexOf(query) >= 0 ||
              (radio.state || radio.city || "").toLowerCase().indexOf(query) >=
                0 ||
              (radio.tags || radio.genres || "").toLowerCase().indexOf(query) >=
                0
            )
              radios.push(getRadioBasics(radio));
          }
          return radios;
        } else {
          if (country === "nigeria") {
            city =
              city.substring(0, 1).toUpperCase() +
              city.substring(1, city.length);
            const radios = (
              await axios.get(`${NG_RADIO_RAPID_API}/?category=${city}`, {
                headers: {
                  "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                  "X-RapidAPI-Host": NG_RADIO_RAPID_API_HOST,
                },
              })
            ).data;
            if (Array.isArray(radios[city]) && radios[city].length) {
              return radios[city].map((r) => {
                r.city = city;
                return getRadioBasics(r);
              });
            }
          }
          let radios = (
            await axios.get(
              `${RADIO_BROWSER_API}/stations/bycountry/${country}`
            )
          ).data;
          if (Array.isArray(radios)) {
            return radios.map((r) => getRadioBasics(r));
          } else {
            //console.log(
            //   `ng radios failed for city: ${city}, with typeof ${typeof radios[
            //     city
            //   ]}`
            // );
            return [];
          }
        }
      } catch (err) {
        throw err;
      }
    },
    async getRadiosByMostPlayed(_, { limit = 100000, offset = 0 }) {
      try {
        //console.log("getting radio by listeners choice");
        const radios = (
          await axios.get(
            `${RADIO_BROWSER_API}/stations/topclick?limit=${limit}&offset=${offset}&hidebroken=true`
          )
        ).data;
        if (!Array.isArray(radios)) return [];
        return radios.map((radio) => getRadioBasics(radio));
      } catch (err) {
        //console.log("err taker", err.message);
        throw err;
      }
    },
    async getRadiosByTopVotes(_, { limit = 100000, offset = 0 }) {
      try {
        //console.log("getting radio top voted");
        const radios = (
          await axios.get(
            `${RADIO_BROWSER_API}/stations/topvote?limit=${limit}&offset=${offset}&hidebroken=true`
          )
        ).data;
        if (!Array.isArray(radios)) return [];
        return radios.map((radio) => getRadioBasics(radio));
      } catch (err) {
        //console.log("err taker", err.message);
        throw err;
      }
    },
    async getRadioById(_, { id }) {
      try {
        const oid = fromObjectID(id);
        //console.log("getting radio... ", oid);
        if (oid) {
          const radio = (
            await axios.get(`${NG_RADIO_RAPID_API}?id=${oid}`, {
              headers: {
                "X-RapidAPI-Key": process.env.RAPID_API_KEY,
                "X-RapidAPI-Host": NG_RADIO_RAPID_API_HOST,
              },
            })
          ).data;
          radio[oid].radio_id = id;
          return getRadioBasics(radio[oid] || {});
        } else {
          // marker
          // const radio = (await axios.get(`${RADIO_BROWSER_API}/url/${id}`)).data;
          const f = (
            await axios.get(`${RADIO_BROWSER_API}/stations/byuuid/${id}`)
          ).data[0];
          //console.log("gotten radio..", f?.name);
          return getRadioBasics(f);
        }
      } catch (err) {
        //console.log(err.message, "err,mee");
        throw err;
      }
    },
  },
  Mutation: {},
};
