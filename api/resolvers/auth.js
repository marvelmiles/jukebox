const mongoose = require("mongoose");
const Users = require("../models/Users");
const jwt = require("jsonwebtoken");
const { getUserBasic, generateToken } = require("../helpers");
const TokenS = require("../models/Tokens");
const { ROLE, FRONTEND_URL, COOKIE_OPTIONS } = require("../config");
const { authenticate } = require("../context");
const {
  AuthenticationError,
  ValidationError,
  ApolloError,
  UserInputError,
} = require("apollo-server-core");
const Tokens = require("../models/Tokens");
module.exports = {
  Query: {
    async signout(_, __, { req, handleError }) {
      try {
        await authenticate(req, handleError);
        await Users.findByIdAndUpdate(req.user, {
          islogin: false,
        });
        return `Signout successful`;
      } catch (err) {
        handleError(err);
      }
    },
    async getNewToken(_, __, { req, res }) {
      try {
        console.log("getting new token ");
        if (!req.cookies.token)
          throw new AuthenticationError("Forbidden access");
        let token = await Tokens.findOne({
          token: req.cookies.token,
        });
        res.cookie(
          "token",
          await generateToken(token.user, true),
          COOKIE_OPTIONS
        );
        const user = await Users.findById(token.user);
        return await generateToken({
          id: user.id,
          username: user.username,
        });
      } catch (err) {
        throw err;
      }
    },
  },
  Mutation: {
    async signin(parent, { username, password }, { req, res }) {
      console.log("signin...", username);
      try {
        if (!(username || password))
          throw new UserInputError("Usernamess or password is incorrect");
        let user = await Users.findOne({
          username,
        });
        if (!user || !user.authenticate(password))
          throw new UserInputError("Username or password is incorrect");
        await Users.updateOne(
          {
            _id: user.id,
          },
          { isLogin: true }
        );
        user = getUserBasic(user);
        res.cookie("token", await generateToken(user.id, true), COOKIE_OPTIONS);
        user.jwtToken = await generateToken(user);
        return user;
      } catch (err) {
        throw err;
      }
    },
    async signup(_, args, { handleError }) {
      try {
        console.log("signup...", args.password);
        typeof args.role === "string" &&
          args.role !== ROLE.ARTIST &&
          (args.role = ROLE.FAN);
        let user = await Users.findOne({
          username: args.username,
        });
        if (user) throw new UserInputError("Username taken");
        user = new Users(args);
        await user.save();
        return "Your account has been setup successfully";
      } catch (err) {
        throw err;
      }
    },
  },
};
