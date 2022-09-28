import Cookies from "universal-cookie";
import CryptoJS from "crypto-js";
import { COOKIE_NAME, _cookieOptions } from "./config";
import WorkerBuilder from "./libs/workers/WorkerBuilder";
import sortWorker from "./libs/workers/sortWorker";
import filterWorker from "./libs/workers/filterWorker";
import includesWorker from "./libs/workers/includesWorker";
import {
  getAlbumByIdGQL,
  getPlaylistByIdGQL,
  getQueryResultGQL,
  getRadioByIdGQL,
  getRadiosByMostPlayedGQL,
  getRadiosByTopVotesGQL,
  getRadiosGQL,
  getSongByIdGQL,
  getUserRecentPlaysGQL,
  getUserSongsGQL,
  getTrendingSongsGQL,
  getTrendingAlbumsGQL,
  getTrendingPlaylistsGQL,
  getTopSearchedSongsGQL,
  getTopSearchedPlaylistsGQL,
  getTopSearchedAlbumsGQL,
  getAnalyticsReportGQL,
  getUserPlaylistsGQL,
  getUserAlbumsGQL,
  getAlbumSongsByIdGQL,
  getPlaylistSongsByIdGQL,
  getUserFavouritesGQL,
} from "./api/apollo-gql";

export const setCookie = (value = "", name = COOKIE_NAME) => {
  const cookies = new Cookies();
  cookies.set(name, value, _cookieOptions);
};

export const getCookie = (name = COOKIE_NAME) => {
  const cookies = new Cookies();
  return cookies.get(name, _cookieOptions) || "";
};

export const encrypt = (data, secret = process.env.REACT_APP_HASH_KEY) => {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    secret || "12345"
  ).toString();
};
export const decrypt = (
  ciphertext,
  secret = process.env.REACT_APP_HASH_KEY
) => {
  ciphertext =
    CryptoJS.AES.decrypt(ciphertext, secret || "12345").toString(
      CryptoJS.enc.Utf8
    ) || null;
  return ciphertext ? JSON.parse(ciphertext) : null;
};

let _user;

export const serializeUserToCookie = (user) => {
  _user = null;
  if (!user) return;
  return setCookie(
    encrypt(
      "-u-" +
        user.jwtToken +
        "_*_" +
        user.username +
        "_*_" +
        user.avatar +
        "_*_" +
        user.role +
        "_*_" +
        user.id +
        "-u-"
    )
  );
};

export const deSerializeUserFromCookie = () => {
  let user = getCookie();
  if (!user) return;
  if (_user) return _user;
  user = decrypt(user);
  user = user
    .slice(user.indexOf("-u-") + 3, user.lastIndexOf("-u-"))
    .split("_*_");
  return user.length
    ? (_user = {
        jwtToken: user[0],
        username: user[1],
        avatar: user[2],
        role: user[3],
        id: user[4],
      })
    : {};
};

export const handleSort = (arr, by, cb) => {
  const worker = new WorkerBuilder(sortWorker);
  worker.postMessage({ arr, by });
  worker.onmessage = ({ data }) => {
    cb(data);
    worker.terminate();
  };
};

export const handleFilter = (arr, query, cb) => {
  const worker = new WorkerBuilder(filterWorker);
  worker.postMessage({ arr, query });
  worker.onmessage = ({ data }) => {
    cb(data);
    worker.terminate();
  };
};

export const handleIncludes = (arr, query, cb) => {
  const worker = new WorkerBuilder(includesWorker);
  worker.postMessage({ arr, query });
  worker.onmessage = ({ data }) => {
    cb(data);
    worker.terminate();
  };
};

export function splitArrayIntoChunksOfLen(arr, len) {
  var chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
}

export const getErrMsg = (
  { networkError, graphQLErrors, clientErrors, message, ...rest },
  log = false
) => {
  let err = "";
  log && console.log("[Error]: ", message);
  clientErrors?.length &&
    clientErrors.forEach(({ message }) => {
      log && console.log("[Client Errrors]: ", message);
      err = err + message + " \n";
    });
  graphQLErrors?.length &&
    graphQLErrors.forEach(({ message, path }) => {
      log && console.log("[GraphQl Error]: ", message);
      err = err + message + " " + JSON.stringify(path) + " \n";
    });
  if (networkError) {
    log &&
      console.log("[Network Error Response]: ", networkError.response?.status);
    !networkError?.result
      ? console.log(rest)
      : networkError?.result.errors?.forEach(({ message }) => {
          log && console.log("[Network Error]: ", message);
          err = err + message + " \n";
        });
  }
  return err;
};

export const createFile = async (fileEndpoint) => {
  try {
    let response = await fetch(fileEndpoint);
    const ext = fileEndpoint.split(/[#?]/)[0].split(".").pop().trim();
    let data = await response.blob();
    let metadata = {
      type: `image/${ext}`,
    };
    let file = new File([data], `file.${ext}`, metadata);
    return Promise.resolve(file);
  } catch (err) {
    console.log(err.message, "errr");
    return Promise.reject(err);
  }
};

export const getCachedData = (query, cache) => {
  switch (query.getType) {
    case "getUserSongs":
      return cache.readQuery({
        query: getUserSongsGQL,
        variables: query.variables,
      }).getUserSongs.data;
    case "getUserPlaylists":
      return cache.readQuery({
        query: getUserPlaylistsGQL,
        variables: query.variables,
      }).getUserPlaylists.data;
    case "getQueryResult":
      return (
        cache.readQuery({
          query: getQueryResultGQL,
          variables: query.variables,
        })?.getQueryResult || {}
      );
    case "getPlaylistSongsById":
      return cache.readQuery({
        query: getPlaylistSongsByIdGQL,
        variables: query.variables,
      }).getPlaylistSongsById;

    case "getAlbumSongsById":
      return cache.readQuery({
        query: getAlbumSongsByIdGQL,
        variables: query.variables,
      }).getAlbumSongsById;
    case "getUserRecentPlays":
      return (
        cache.readQuery({
          query: getUserRecentPlaysGQL,
          variables: query.variables,
        }).getUserRecentPlays || []
      );
    case "getUserFavourites":
      return (
        cache.readQuery({
          query: getUserFavouritesGQL,
          variables: query.variables,
        }).getUserFavourites || []
      );
    case "user-songs":
      return cache.readQuery({
        query: getUserSongsGQL,
      })?.getUserSongs;
    case "get-song":
      return [
        cache.readQuery({
          query: getSongByIdGQL,
          variables: query.variables,
        })?.getSongById,
      ];
    case "get-radio":
      return [
        cache.readQuery({
          query: getRadioByIdGQL,
          variables: query.variables,
        })?.getRadioById,
      ];
    case "get-playlist":
      return cache.readQuery({
        query: getPlaylistByIdGQL,
        variables: query.variables,
      })?.getPlaylistById?.playlist;
    case "get-album":
      return cache.readQuery({
        query: getAlbumByIdGQL,
        variables: query.variables,
      })?.getAlbumById?.playlist;
    case "getUserPlaylists":
      return cache.readQuery({
        query: getUserPlaylistsGQL,
        variables: query.variables,
      }).getUserPlaylists;
    case "getUserAlbums":
      return cache.readQuery({
        query: getUserAlbumsGQL,
        variables: query.variables,
      }).getUserAlbums;
    case "getRadios":
      return cache.readQuery({
        query: getRadiosGQL,
        variables: query.variables,
      }).getRadios;
    case "getQueryResult":
      return query.key
        ? cache.readQuery({
            query: getQueryResultGQL,
            variables: query.variables,
          }).getQueryResult[query.key]
        : cache.readQuery({
            query: getQueryResultGQL,
            variables: query.variables,
          }).getQueryResult;
    case "trendingSongs":
      return cache.readQuery({
        query: getTrendingSongsGQL,
        variables: query.variables,
      }).getAnalyticsReport.trendingSongs.data;
    case "trendingAlbums":
      return cache.readQuery({
        query: getTrendingAlbumsGQL,
        variables: query.variables,
      }).getAnalyticsReport.trendingAlbums.data;
    case "trendingPlaylists":
      return cache.readQuery({
        query: getTrendingPlaylistsGQL,
        variables: query.variables,
      }).getAnalyticsReport.trendingPlaylists.data;
    case "topSearchedSongs":
      return cache.readQuery({
        query: getTopSearchedSongsGQL,
        variables: query.variables,
      })?.getAnalyticsReport.topSearchedSongs;
    case "topSearchedAlbums":
      return cache.readQuery({
        query: getTopSearchedAlbumsGQL,
        variables: query.variables,
      })?.getAnalyticsReport.topSearchedAlbums;
    case "topSearchedPlaylists":
      return cache.readQuery({
        query: getTopSearchedPlaylistsGQL,
        variables: query.variables,
      })?.getAnalyticsReport.topSearchedPlaylists;
    case "getAnalyticsReport":
      return cache.readQuery({
        query: getAnalyticsReportGQL,
        variables: query.variables,
      })?.getAnalyticsReport[query.key];
    default:
      return []
        .concat(
          cache.readQuery({
            query: getRadiosGQL,
          })?.getRadios,
          cache.readQuery({
            query: getRadiosByMostPlayedGQL,
          })?.getRadiosByMostPlayed,
          cache.readQuery({
            query: getRadiosByTopVotesGQL,
          })?.getRadiosByTopVotes
        )
        .filter((r) => !!r);
  }
};

// fisher-yates shuffle algorithm
export const shuffleArray = (arr, modify = false) => {
  arr = modify ? arr : arr.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const shuffleList = (list, activeItem, activeIndex = 0) => {
  list = shuffleArray(list);
  const index = list.findIndex((item) => item.id === activeItem.id);
  if (index !== -1) {
    list[index] = list[activeIndex];
    list[activeIndex] = activeItem;
  }
  return list;
};

export const getIdsFromList = (List) => {
  const ids = [];
  if (!List) return ids;
  for (let item in List) {
    ids.push(List[item].id || (List[item] >= 0 ? item : List[item]));
  }
  return ids;
};

export const debounce_leading = (fn, delay = 500) => {
  let timer;
  return (...args) => {
    if (!timer) {
      fn.apply(this, args);
    }
    clearTimeout(timer);
    delay &&
      (timer = setTimeout(() => {
        timer = null;
      }, delay));
  };
};

export const isTouchDevice = () =>
  window.matchMedia("(max-width:1024px)").matches ||
  ((/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.platform)) &&
    "ontouchstart" in window &&
    (navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0 ||
      ("matchMedia" in window &&
        window.matchMedia("(pointer:coarse)").matches)));
