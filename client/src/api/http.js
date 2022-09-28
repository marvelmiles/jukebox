import { BACKEND_URL } from "../config";
import { deSerializeUserFromCookie, serializeUserToCookie } from "../helpers";

// Based on graphql Queries will be sent as POST
// where the query will be passed in the payload body

// eslint-disable-next-line
// export default {
//   baseUrl: BACKEND_URL + "/api",
//   post(url, body = {}, config = {}) {
//     this.endpoint = this.baseUrl + url;
//     // let storageData = sessionStorage.getItem(this.endpoint);
//     // if (storageData !== null) return Promise.resolve(JSON.parse(storageData));
//     const abortCont = new AbortController();
//     cancelRequest.push({
//       pathname: window.location.pathname,
//       controller: abortCont,
//     });
//     return fetch(this.endpoint, {
//       body: JSON.stringify(body),
//       headers: {
//         "content-type": "application/json",
//       },
//       ...config,
//       method: "POST",
//       signal: abortCont.signal,
//     })
//       .then((res) => {
//         return res.json().then((data) => {
//           if (!res.ok) {
//             return Promise.reject((data && data.message) || res.statusText);
//           }
//           sessionStorage.setItem(url, JSON.stringify(data));
//           return Promise.resolve(data.data || data);
//         });
//       })
//       .catch((err) => {
//         if (err.name === "AbortError") {
//           return Promise.reject("Encountered some error while fetching");
//         }
//         return Promise.reject(err);
//       });
//   },
// };

let isRefreshing = false;
let failedQueue = {},
  cancelRequest = [];

const processQueue = (err, token) => {
  for (let key in failedQueue) {
    if (err) {
      failedQueue[key].reject(err);
    } else {
      failedQueue[key].jwtToken = token;
      failedQueue[key].resolve(failedQueue[key]);
    }
  }
};

export const handleCancelRequest = (url = "pathname") => {
  switch (url) {
    case "pathname":
      for (let i = 0; i < cancelRequest.length; i++) {
        if (cancelRequest[i].pathname === window.location.pathname) {
          cancelRequest[i].controller.abort();
          cancelRequest = cancelRequest.splice(i, 1);
        }
      }
      break;
    default:
      break;
  }
};

// eslint-disable-next-line
export default (uri, options) => {
  const controller = new AbortController();
  options.signal = controller.signal;
  cancelRequest.push({
    controller,
    pathname: window.location.pathname,
  });
  if (failedQueue[options.body]) {
    console.log("suf dnte ebody,.,...");
    return;
  }
  return fetch(uri, options)
    .then((res) => {
      if (res.status === 401) {
        console.log("refreshing...", isRefreshing);
        if (options._queued) {
          console.log("quwuedd naa,,,");
          return;
        }
        if (isRefreshing) {
          options._queued = true;
          console.log("has queused....");
          new Promise(function (resolve, reject) {
            failedQueue[options.body] = { resolve, reject, uri, options };
          })
            .then((queue) => {
              queue.options.headers.authorization = `Bearer ${queue.jwtToken}`;
              return fetch(queue.uri, queue.options);
            })
            .catch((err) => Promise.reject(err));
        } else {
          isRefreshing = true;
          return fetch(res.url, {
            ...options,
            method: "post",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({
              query: `
    query {
      getNewToken
    }
    `,
            }),
            credentials: "include",
          })
            .then((res) => {
              if (res.status === 403) {
                console.log("nav signi....");
                return (window.location.href = "/u/signin");
              }
              return res
                .json()
                .then(({ data }) => {
                  console.log("new token", data.getNewToken.length);
                  const user = deSerializeUserFromCookie() || {};
                  user.jwtToken = data.getNewToken;
                  serializeUserToCookie(user);
                  console.log("successfuly updated jwtToken");
                  options.headers.authorization = `Bearer ${data.getNewToken}`;
                  processQueue(null, data.getNewToken);
                  return fetch(uri, options);
                })
                .catch((err) => {
                  console.log(err.message, "errr in process queue");
                  processQueue(err, null);
                  return Promise.reject(err);
                })
                .finally(() => {
                  isRefreshing = false;
                });
            })
            .catch((err) => {
              console.log("res 2...");
              return Promise.reject(err);
            });
        }
      }
      return res;
    })
    .catch((err) => {
      // err_connection_refused
      console.log(err.message, "err 1");
    });
};
