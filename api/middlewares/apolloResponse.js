const {
  runHttpQuery,
  ApolloError,
  AuthenticationError,
  ValidationError,
} = require("apollo-server-core");
module.exports = (apolloServer) => {
  return async (req, res, next) => {
    if (
      !req.headers["content-type"] ||
      (req.headers["content-type"] !== "application/json" &&
        req.headers["content-type"]?.indexOf("multipart/form-data") === -1)
    ) {
      console.log(req.headers["content-type"]);
      return next("Forbidden request type");
    }

    const _options = await apolloServer.createGraphQLServerOptions(req, res);
    _options.formatError = (err) => {
      // console.log(
      //   "formatting error..",
      //   err.name,
      //   err.extensions.exception.name,
      //   err.message
      // );
      err =
        typeof _options.formatErrorFn === "function"
          ? _options.formatErrorFn(err)
          : err;
      const _getMSG = (err) => {
        const index = err.message.indexOf(":");
        if (index < 0) return err.message || err.name;
        let msg = err.message.slice(index + 1, err.message.length + 1);
        msg = msg.slice(msg.indexOf(":") + 1, msg.length + 1).trim();
        return msg;
      };

      switch (err.extensions.exception.name || err.name) {
        case "GraphQLError":
          switch (err.extensions.code) {
            case "GRAPHQL_VALIDATION_FAILED":
            case "BAD_USER_INPUT":
              res.statusCode = 400;
              return err;
            case "UNAUTHENTICATED":
              // handle res status for various message
              if (/(?:unknown|server).*?error/gim.test(err.message))
                res.statusCode = 500;
              else if (/exists|createdby/gim.test(err.message))
                res.statusCode = 409;
              else if (/not found/gim.test(err.message)) res.statusCode = 404;
              else if (/forbidden/gim.test(err.message)) res.statusCode = 403;
              else res.statusCode = 401;
              return err;
            default:
              res.statusCode = 500;
              return err;
          }
        case "ValidationError":
          // mongoose validation error
          res.statusCode = 400;
          return new Error(_getMSG(err));
        case "TokenExpiredError":
          res.statusCode = 401;
          return new AuthenticationError("Token expired");
        case "CastError":
          res.statusCode = 400;
          // mongoose cast error
          return new Error(_getMSG(err));
        case "JsonWebTokenError":
          res.statusCode = 401;
          return new AuthenticationError("Unauthorized access");
        case "UnauthorizedError":
          res.statusCode = 401;
          // jwt authentication error
          return new Error("Unauthorized access");
        default:
          break;
      }
      if (err.code === 11000) {
        res.statusCode = 400;
        // mongoose duplicate key error
        console.log("validation error: ", err.message);
        return new Error(_getMSG(err));
      } else {
        res.statusCode = 500;
        console.log("internal error message: ", err.message);
        return new Error(err);
      }
    };
    runHttpQuery([req, res], {
      method: req.method,
      options: _options,
      query: req.method === "POST" ? req.body : req.query,
      request: req,
    }).then(
      ({ graphqlResponse, initResponse = {} }) => {
        // console.log(res.statusCode);
        if (initResponse.headers) {
          for (const [name, value] of Object.entries(initResponse.headers)) {
            res.setHeader(name, value);
          }
        }
        res.setHeader("Content-type", "application/json");
        res.send = typeof res.send === "function" ? res.send : res.end;
        res.send(graphqlResponse);
      },
      (error) => {
        console.log(error?.name, "run http query err");
        if ("HttpQueryError" !== error.name) {
          return next(error);
        }
        if (error.headers) {
          for (const [name, value] of Object.entries(error.headers)) {
            res.setHeader(name, value);
          }
        }

        console.log(res.statusCode, "status code");
        if (typeof res.send === "function") {
          // Using `.send` is a best practice for Express, but we also just use
          // `.end` for compatibility with `connect`.
          res.send(error.message);
        } else {
          res.end(error.message);
        }
      }
    );
  };
};
