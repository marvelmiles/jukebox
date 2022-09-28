const mongoose = require("mongoose");
const { createPbk } = require("../helpers");
const { v4: uniq } = require("uuid");
const { ROLE } = require("../config");
const schema = mongoose.Schema(
  {
    email: {
      type: String,
      required: "Your email is required",
    },
    username: {
      type: String,
      required: "Your username is required",
    },
    avatar: {
      type: String,
      default: "http://localhost:8080/avatar/person.png",
    },
    role: {
      type: String,
      default: ROLE.FAN,
    },
    isLogin: {
      type: Boolean,
      default: false,
    },
    salt: String,
    password: {
      type: String,
      required: "Password is required",
      set: function (pwd) {
        this.salt = uniq();
        return this.encryptPwd(pwd);
      },
    },
    followers: Array,
    following: Array,
    recentPlays: Object,
    favourites: Object,
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: function (doc, ret) {
        // remove the props when object is serialized
        delete ret._id;
        delete ret.salt;
        delete ret.password;
      },
    },
  }
);

schema.methods = {
  authenticate(value) {
    return this.encryptPwd(value) === this.password;
  },
  isArtist() {
    return this.role === ROLE.ARTIST;
  },
  encryptPwd(pwd) {
    if (!pwd) return this.invalidate("password", err.message);
    try {
      return createPbk(pwd);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = mongoose.model("users", schema);
