const dns = require("dns");
const util = require("util");
const resolveSrv = util.promisify(dns.resolveSrv);
const { ReadableWebToNodeStream } = require("readable-web-to-node-stream");
const mm = require("music-metadata");
const {
  AuthenticationError,
  ValidationError,
  UserInputError,
} = require("apollo-server-express");
const crypto = require("crypto");
const Tokens = require("./models/Tokens");
const { v4 } = require("uuid");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { isValidObjectId } = require("mongoose");
const {
  IMAGE_COVER_TYPE,
  BACKEND_URL,
  IMAGE_HOST_COVER_TYPE,
  AUDIO_HOST_TYPE,
  AUDIO_TYPE,
  FILE_TYPE,
  ROLE,
  NG_RADIO_RAPID_API_HOST,
  NG_RADIO_RAPID_API,
  RADIO_BROWSER_API,
} = require("./config");
const axios = require("axios");
const cron = require("node-cron");

const isObject = (type) => {
  return (
    type.toString() === "[object Object]" ||
    !(
      typeof type === "string" ||
      typeof type === "function" ||
      Array.isArray(type)
    )
  );
};
const uniq = () => {
  return v4().replace(/-/gm, "");
};

// toObjectID create an id bit similar to browser-info/uuid (id format)
// which merge  the original radio_id  and make it more uniq.
const toObjectID = (strOrNum) => {
  if (!strOrNum) return "";
  strOrNum = parseInt(strOrNum);
  const str = crypto.randomBytes(14).toString("hex");
  let hex = parseInt(strOrNum).toString(16);
  if (hex.length < 4) {
    var text = "";
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for (var i = 0; i < 6; i++)
      text += letters.charAt(Math.floor(Math.random() * letters.length));
    hex += text.toLowerCase();
  }
  return [
    hex,
    "-",
    str.slice(0, 8),
    "-",
    str.slice(8, 12),
    "-",
    str.slice(12, 24),
  ].join("");
};

const isObjectID = (strOrNum) => {
  strOrNum = strOrNum.split("-");
  return strOrNum.length === 4 && strOrNum[1].length === 8;
};

const fromObjectID = (idHex) => {
  if (!isObjectID(idHex)) return null;
  let id = idHex.split("-")[0];
  id = id.length > 4 ? id.slice(0, id.indexOf(id.slice(-6))) : id;
  return parseInt(id, 16);
};

const isToday = (timestamp, strict = true) => {
  const today = new Date();
  timestamp = new Date(parseInt(timestamp));
  return strict
    ? timestamp.getDate() === today.getDate()
    : timestamp.getDate() >= today.getDate() - 5 &&
        timestamp.getMonth() === today.getMonth() &&
        timestamp.getFullYear() === today.getFullYear();
};

const runParallel = (array, fn) => {
  return new Promise((resolve, reject) => {
    let i = 0;
    const next = () => {
      fn(array[i])
        .then(() => {
          i++;
          if (i < array.length) next();
          else resolve();
        })
        .catch((err) => console.log("Err in parallel run... ", err.message));
    };
    next();
  });
};

const createFilePath = (type, filename = "", key = "") => {
  if (!type)
    return path.resolve(filename.replace(`${BACKEND_URL}`, process.cwd()));
  filename = path.basename(filename);
  switch (type) {
    case IMAGE_HOST_COVER_TYPE:
      if (key) return `${BACKEND_URL}/uploads/images/${key}/${filename}`;
      else
        return `${BACKEND_URL}/uploads/images/collection/${
          key === undefined ? "cover.png" : filename
        }`;
    case IMAGE_COVER_TYPE:
      if (key)
        return path.resolve(
          `${process.cwd()}/uploads/images/${key}/${filename}`
        );
      else
        return path.resolve(
          `${process.cwd()}/uploads/images/collection/${
            key === undefined ? "cover.png" : filename
          }`
        );
    case AUDIO_HOST_TYPE:
      if (key) return `${BACKEND_URL}/uploads/audios/${key}/${filename}`;
      else return `${BACKEND_URL}/uploads/audios/cover.png`;
    case AUDIO_TYPE:
      if (key)
        return path.resolve(
          `${process.cwd()}/uploads/audios/${key}/${filename}`
        );
      else return path.resolve(`${process.cwd()}/uploads/audios/cover.png`);
    default:
      return "";
  }
};

const deleteFile = (file) => {
  fs.existsSync(file) && fs.unlinkSync(file);
};

const storeFS = (stream, filePath) => {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.parse(filePath).dir, { recursive: true });
    if (Buffer.isBuffer(stream)) {
      try {
        fs.writeFileSync(filePath, stream);
        return resolve();
      } catch (err) {
        return reject(err);
      }
    }
    stream
      .on("error", (err) => {
        if (stream.trauncated) fs.unlinkSync(filePath);
        reject(err);
      })
      .pipe(fs.createWriteStream(filePath))
      .on("error", (err) => {
        reject(err);
      })
      .on("finish", () => resolve(filePath));
  });
};

const getLocation = async () => {
  try {
    const data = (
      await axios.get(
        "https://api.ipgeolocation.io/ipgeo?apiKey=61fd6ca0b37d47b7be14441cd2082160&fields=country_name,city"
      )
    ).data;
    return {
      country: data.country_name || "nigeria",
      city: data.city || "lagos",
    };
  } catch (err) {
    return {
      country: "nigeria",
      city: "lagos",
    };
  }
};

const getStat = (obj) => {
  const stat = {
    today: 0,
    prev: 0,
  };
  if (!obj) return stat;
  for (let key in obj) {
    if (obj[key]) {
      if (isToday(obj[key])) stat.today += 1;
      else stat.prev += 1;
    }
  }
  return stat;
};

// fisher-yates shuffle algorithm
const shuffleArray = (arr, modify = true) => {
  arr = modify ? arr : arr.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
module.exports = {
  isObject,
  uniq,
  isToday,
  getLocation,
  getStat,
  shuffleArray,
  createPbk: (secret, round = 50000, salt = process.env.HASH_KEY) => {
    return crypto.pbkdf2Sync(secret, salt, round, 16, "sha512").toString("hex");
  },
  async generateToken(user, isRefresh = false) {
    if (isRefresh)
      return (
        await new Tokens({
          user: user,
          token: v4().replace(/-/g, ""),
          expiresIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }).save()
      ).token;
    return jwt.sign(user, process.env.TOKEN_SECRET, {
      expiresIn: "1m",
    });
  },
  getUserBasic: (user) => ({
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    jwtToken: user.jwtToken,
    isLogin: user.isLogin,
    role: user.role,
  }),
  storeFS,
  deleteFile,
  createFilePath,
  async getMusicMetaData(readStream, options) {
    try {
      const {
        common,
        format: { duration },
      } = await mm.parseStream(readStream, {
        duration: true,
        ...options,
      });
      common.picture = mm.selectCover(common.picture);
      return Promise.resolve({
        duration,
        ...common,
      });
    } catch (err) {
      return Promise.reject(err);
    }
  },
  getRadioBasics(radio) {
    return {
      id:
        radio.stationuuid ||
        (isObjectID(radio.radio_id)
          ? radio.radio_id
          : toObjectID(radio.radio_id)),
      name:
        (radio.name || radio.radio_name || "").toLowerCase().indexOf("fm") >= 0
          ? radio.name || radio.radio_name || ""
          : (radio.name || radio.radio_name || "") + " Fm",
      cover: radio.favicon || radio.radio_image || "",
      url:
        radio.url_resolved ||
        radio.url ||
        radio.urlCache ||
        radio.radio_url ||
        "",
      category: radio.category || radio.category_name || "",
      country: radio.country || "",
      city: radio.state
        ? radio.state.toLowerCase().indexOf("state") >= 0
          ? radio.state
          : radio.state + " State"
        : radio.city || "",
      language: radio.language || "",
      genres: radio.tags || radio.genres || "",
      language: radio.langauage || "",
      homepage: radio.homepage || "",
    };
  },

  encrypt(secret = process.env.REACTstatAPP_HASH_KEY, key, iv) {
    try {
      const cipher = crypto.createCipheriv("aes128", key, iv);
      // cipher.setAutoPadding(false);
      return `${Buffer.concat([cipher.update(secret), cipher.final()]).toString(
        "hex"
      )}`;
    } catch (err) {
      console.log(err.message);
    }
  },
  decrypt(encrypted, key = process.env.CIPHER_KEY, iv) {
    try {
      encrypted = Buffer.from(encrypted, "hex");
      let decipher = crypto.createDecipheriv("aes128", key, iv);
      let decrypted = decipher.update(encrypted, "hex");
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (err) {
      console.log(err.message, "err decrypting...");
      return null;
    }
  },
  toObjectID,
  isObjectID,
  fromObjectID,
  async concatSongs(Collection, IDList) {
    let songs = [],
      failures = "";
    for (let i in IDList) {
      let id = IDList[i];
      try {
        if (typeof id !== "string") {
          throw new Error("Expect  payload to be an array of string");
          break;
        }
        if (!isValidObjectId(id)) {
          throw new Error(`Invalid id in payload at index ${i}`);
          break;
        }

        songs = songs.concat((await Collection.findById(id)).songs);
      } catch (err) {
        if (err.name === "Error" && !err.code) failures = err.message;
        else if (failures.length === 0) {
          failures += "Failed to update playlist(s): " + id;
        } else failures += key;
        throw new UserInputError(failures);
      }
    }
    return songs;
  },

  // maybe later hoping payload can be a mix
  // of array or string data type
  async addToMediaCollectionSet(setName, { type, payload }, user, Collection) {
    if (!/songs|albums|playlists|radios/i.test(type))
      throw new UserInputError(
        `Incorrect type expect: tracks|albums|playlists`
      );

    for (let key in payload) {
      if (!isValidObjectId(payload[key]) && type === "songs") {
        throw new UserInputError(`Fauslty id in payload at index ${key}`);
        break;
      }
    }
    for (let id in payload) {
      id = payload[id];

      await Collection.updateOne(
        {
          _id: user,
        },
        {
          $addToSet: {
            [`${setName}.${type}`]: id,
          },
        },
        { new: true }
      );
      // if (isObjectID(id)) {
      //   console.log("is object id");
      // } else {
      //   console.log(
      //     (await axios.get(`${RADIOstatBROWSERstatAPI}/url/${id}`)).data
      //   );
      // }
    }
  },
  async removeFromMediaCollectionSet(
    setName,
    { type, payload },
    user,
    Collection
  ) {
    if (!/songs|albums|playlists|radios/i.test(type))
      throw new UserInputError(
        `Incorrect type expect: tracks|albums|playlists`
      );
    for (let id in payload) {
      id = payload[id];
      console.log(id);
      await Collection.updateOne(
        {
          _id: user,
        },
        {
          $pull: {
            [`${setName}.${type}`]: id,
          },
        },
        { new: true }
      );
    }
  },
  findQueryBuilder(query, modelName = "") {
    switch (modelName) {
      case "playlists":
        return {
          $or: [
            {
              name: {
                $regex: query,
                $options: "i",
              },
            },
          ],
        };
      case "albums":
        return {
          $or: [
            {
              name: {
                $regex: query,
                $options: "i",
              },
            },
            {
              artist: {
                $regex: query,
                $options: "i",
              },
            },
          ],
        };

      case "users":
        return [
          {
            username: {
              $regex: query,
              $options: "i",
            },
          },
          {
            email: {
              $regex: query,
              $options: "i",
            },
          },
        ];

      default:
        return {
          $or: [
            {
              title: {
                $regex: query,
                $options: "i",
              },
            },
            {
              artist: {
                $regex: query,
                $options: "i",
              },
            },
            {
              album: {
                $regex: query,
                $options: "i",
              },
            },
            // ...(/^\d+$/.test(query) && {
            //   year: {
            //     $regex: query,
            //     $options: "i",
            //   },
            // }),
          ],
        };
    }
  },
  getIp(req) {
    if (req.headers["x-forwarded-for"]) {
      //in case the ip returned in a format: "::ffff:146.xxx.xxx.xxx"
      return req.headers["x-forwarded-for"].split(",")[0].split(":").slice(-1);
    } else if (req.connection && req.connection.remoteAddress) {
      return req.connection.remoteAddress;
    } else {
      return req.ip;
    }
  },
  runParallel,
  getTimeAgo(ago = 3) {
    const prev = new Date();
    prev.setMonth(prev.getMonth() - ago);
    // const date = new Date(parseInt(timestamp));
    // date.getFullYear() === prev.getFullYear() &&
    // date.getMonth() >= prev.getMonth()
    return prev;
  },
  async getTopSearchedSongs(args = {}) {
    args.sortOp = args.category;
    return await getAnalyticsSortedArray("query", "songs", args);
  },
  async getTopSearchedArtists(args = {}) {
    args.sortOp = args.category;
    args.priority = ROLE.ARTIST;
    return await getAnalyticsSortedArray("query", "users", args);
  },
  async getTrendingSongs(args = {}) {
    console.log("ffff");
    args.sortOp = args.category;
    return await getAnalyticsSortedArray("observe", "songs", args);
  },
  async getTrendingArtists(args = {}) {
    return (await getAnalyticsSortedArray("observe", "users", args)).filter(
      (u) => u.role === ROLE.ARTIST
    );
  },
  async getTrendingAlbums(args = {}) {
    return await getAnalyticsSortedArray("observe", "albums", args);
  },
  async getTrendingPlaylists(args = {}) {
    return await getAnalyticsSortedArray("observe", "playlists", args);
  },
  async getAllRadios(limit = 1000) {
    try {
      let radios = [];
      let categories = (
        await axios.get(`${NG_RADIO_RAPID_API}?categories=q`, {
          headers: {
            "X-RapidAPI-Key":
              "012959fefdmsh1db7fe5d30b69dcp1c1218jsnc2be96848b6a",
            "X-RapidAPI-Host": NG_RADIO_RAPID_API_HOST,
          },
        })
      ).data.categories;

      await runParallel(categories, (category) => {
        return axios
          .get(`${NG_RADIO_RAPID_API}?category=${category}`, {
            headers: {
              "X-RapidAPI-Key":
                "012959fefdmsh1db7fe5d30b69dcp1c1218jsnc2be96848b6a",
              "X-RapidAPI-Host": NG_RADIO_RAPID_API_HOST,
            },
            maxRedirects: 0,
            timeout: 60000,
          })
          .then(({ data }) => {
            // console.log("fetched data for ", category);
            data = data[category];
            if (Array.isArray(data)) {
              radios = radios.concat(data);
            } else
              console.log(
                `Error NG browser didn't return an array ${categories[i]}`
              );
          })
          .catch((err) =>
            console.log("Error while fetching ng radios ", err.message)
          );
      });
      console.log("done resolving parallel... ", radios.length);
      const data = (
        await axios.get(`${RADIO_BROWSER_API}/stations?limit=${limit}`, {
          maxRedirects: 0,
          timeout: 60000,
        })
      ).data;
      if (Array.isArray(data)) radios = radios.concat(data);
      else console.log("Err radio browser didn't return an array");
      // console.log("done resolving radios... ", radios.length);
      return Promise.resolve(radios);
    } catch (err) {
      console.log(err.message, "got erro while fetching radios...");
      return Promise.reject([]);
    }
  },
  scheduleTask(dueTime = "", dueDate = "", cb) {
    try {
      const [hr = "*", min = "*"] = dueTime.split(":");
      const [mth = "*", day = "*", yr = "*"] = dueDate.split("/");
      const exp = `* ${min || "*"} */${hr || "*"} ${day || "*"} ${
        mth || "*"
      } *`;
      console.log(exp, "node-expresssion");
      const task = cron.schedule(exp, () => cb(task));
    } catch (err) {
      console.log(err.message, " tas err");
    }
  },
  async deleteFileAndUpload(file, key, deleteFile) {
    try {
      const deleteFile = (file) => {
        fs.existsSync(file) && fs.unlinkSync(file);
      };
      await storeFS(
        file.file.createReadStream(),
        createFilePath(IMAGE_COVER_TYPE, file.file.filename, key)
      );
      deleteFile(createFilePath(IMAGE_COVER_TYPE, file.file.filename, key));
      return createFilePath(IMAGE_HOST_COVER_TYPE, file.file.filename, key);
    } catch (err) {
      throw err;
    }
  },
  async getAll(Collection, query, options = {}) {
    const { pagination = {}, sortRule, group } = options;
    const total = await Collection.countDocuments(query);
    pagination.limit = pagination.limit >= 0 ? pagination.limit : 40;
    pagination.next = `6310c8cfef89d3d2ff27b0db_1662044367781`;
    if (pagination.next) {
      const [nextId, nextUploadedAt] = pagination.next.split("_");
      query = {
        $or: [
          { ...query, _id: { $gt: nextId } },
          {
            ...query,
            [Collection.modelName === "songs" ? "uploadedAt" : "createdAt"]: {
              $gt: nextUploadedAt,
            },
          },
        ],
      };
    }
    const data = await Collection.find(query)
      .sort({ createdAt: 1, _id: 1, uploadedAt: 1, ...sortRule })
      .limit((Number(pagination.limit) || 0) + 1);
    const hasNext = data.length > pagination.limit;
    if (hasNext) data.pop();
    return {
      data,
      pagination: {
        total,
        hasNext,
        next: hasNext
          ? `${data[data.length - 1]._id}_${
              Number(data[data.length - 1].uploadedAt) ||
              data[data.length - 1].createdAt.getTime()
            }`
          : "",
      },
      group,
    };
  },
  async getTopDownloads() {},
};
