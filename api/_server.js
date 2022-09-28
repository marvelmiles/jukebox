const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const graphqlUploadExpress = require("graphql-upload/graphqlUploadExpress.js");
const cors = require("cors");
const { FRONTEND_URL } = require("./config");
var app = express();
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
scalar FileUpload
type Files {
    filename:String
    encoding:String
} 
input File {
    filename:String
}  
type Query {
    hello: String
  }
  type Mutation {
      uploadSongs(files:FileUpload):Files
  }
`);

// The root provides a resolver function for each API endpoint
var root = {
  hello: () => {
    return "Hello world!";
  },
  uploadSongs(_, args, c, h) {
    console.log("uploading..", c.variableValues.files[0].file);
    const { filename, mimetype, encoding } = c.variableValues.files[0].file;
    console.log(filename);
    return {
      filename: filename,
      encdoing: encoding,
    };
  },
};

app.use(
  "/graphql",
  graphqlUploadExpress(),
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(8080, () => console.log("app running on port"));
