const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const { ApolloServer, gql } = require("apollo-server-express");
const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const { FRONTEND_URL } = require("./config");
const apolloResponse = require("./middlewares/apolloResponse");
const graphqlUploadExpress = require("graphql-upload/graphqlUploadExpress.js");
const GQLUpload = require("graphql-upload/GraphQLUpload.js");
const Upload = require("graphql-upload/Upload.js");
const { UserInputError } = require("apollo-server-express");
const csrf = require("csurf");
const multer = require("multer");
const { deleteFile } = require("./helpers");
const crypto = require("crypto");
const convert = require("amrhextotext");
const socket = require("./socket");
const Analytics = require("./models/Analytics");

dotenv.config();
// const GraphQLUpload = require("graphql-upload/graphqlUploadExpress");
const _pro = csrf({
  cookie: true,
});
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req, res }) => ({ req, res }),
  // cache: "bounded",
});
server.start().then(() => {
  mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  app.use("/graphql", graphqlUploadExpress(), apolloResponse(server));
  socket(app);
});
