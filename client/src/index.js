import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { StateProvider } from "./provider";
import reducer from "./provider/reducer";
import { initState } from "./provider/state";
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  from,
  concat,
  ApolloLink,
  HttpLink,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import reportWebVitals from "./reportWebVitals";
import { BACKEND_URL } from "./config";
import { createUploadLink } from "apollo-upload-client";
// import "./index.css";
import http from "./api/http";
import { deSerializeUserFromCookie, getErrMsg } from "./helpers";
const root = ReactDOM.createRoot(document.getElementById("root"));

const httpLink = createUploadLink({
  uri: BACKEND_URL + "/graphql",
  fetch: http,
});

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext(({ authorize, headers, credentials }) => {
    authorize && console.log(authorize, " authorizing...");
    headers = headers || {};
    if (authorize)
      headers.authorization = `Bearer ${deSerializeUserFromCookie().jwtToken}`;
    return {
      headers,
      credentials: authorize || credentials ? "include" : "omit",
    };
  });
  return forward(operation);
});

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      QueryResult: {
        fields: {
          hasSorted: {
            read(v) {
              return !!v;
            },
          },
        },
      },
    },
  }),
  link: authLink.concat(httpLink),
});

root.render(
  <StateProvider initState={initState} reducer={reducer}>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StateProvider>
);

reportWebVitals();
