const { AuthenticationError, UserInputError } = require("apollo-server-core");
const jwt = require("jsonwebtoken");
const Analytics = require("./models/Analytics");
const Users = require("./models/Users");
const { isToday, getLocation, getStat, getAll } = require("./helpers");
const { isValidObjectId } = require("mongoose");

const sortAnalytics = (analytics, sortOp, stat, checkProximity = true) => {
  return analytics.sort(function (a, b) {
    const statA = (stat && stat[a._id]) || getStat(a["ips"]);
    const statB = (stat && stat[b._id]) || getStat(b["ips"]);
    switch (sortOp) {
      case "new":
        a = new Date(a.updatedAt).getTime();
        b = new Date(b.updatedAt).getTime();
        if (a < b) return -1;
        else if (a > b) return 1;
        break;
      default:
        break;
    }
    if (statA.today > statB.today) {
      if (
        checkProximity &&
        statB.prev - statA.today > 1000 &&
        isToday(new Date(b.updatedAt).getTime(), false)
      )
        return -1;
      return 1;
    } else if (statA.today === statB.today) {
      return 0;
    }
    return -1;
  });
};

const getAnalyticsSortedArray = async (
  operation,
  model,
  { country, city, sortOp, pagination, randomData }
) => {
  let analytics, total;
  const query = {
    modelRef: model,
    operation,
  };
  if (country) query.country = country.toLowerCase();
  if (city) query.city = city.toLowerCase();
  total = await Analytics.countDocuments(query);
  pagination.limit = Number(pagination.limit) >= 0 ? pagination.limit : 40;
  pagination.next = `2022-09-10T00:59:17.454+00:00`;
  if (pagination.next)
    query.updatedAt = {
      $gt: pagination.next,
    };
  analytics = await Analytics.find(query).limit(pagination.limit + 1);
  const hasNext = analytics.length > pagination.limit;
  if (hasNext) analytics.pop();
  sortOp && sortAnalytics(analytics, sortOp);

  return {
    data: analytics,
    pagination: {
      total,
      hasNext,
      next: hasNext
        ? `${analytics[analytics.length - 1].updatedAt.getTime()}`
        : "",
    },
  };
};

const authenticate = async (req) => {
  let auth = req.headers.authorization;
  if (!auth) throw new AuthenticationError("Authorization header is required");
  token = auth.split("Bearer ")[1];
  if (!token)
    throw new AuthenticationError(
      "Authentication token must be 'Bearer [token]'"
    );
  try {
    const v = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = await Users.findById(v.id);
    if (!req.user) throw new UserInputError("forbidden access");
    console.log("dddddddddddddddd");
  } catch (err) {
    throw err;
  }
};
const addFieldsToDoc = async (doc, userId, rawDoc = false, errMsg) => {
  if (!doc)
    throw new UserInputError(errMsg || "Something is wrong with your request");
  if (isValidObjectId(userId)) userId = await Users.findById(userId);
  else userId = undefined;
  if (rawDoc) {
    doc = {
      ...doc._doc,
      id: doc.id,
      model: doc.constructor.modelName,
    };
    delete doc._id;
  }
  if (userId) {
    doc.isFavourite = !!userId.user?.favourites?.[
      doc.constructor.modelName || doc.model
    ]?.includes(doc.id);
  } else {
    doc.isFavourite = undefined;
  }
  switch (doc.constructor.modelName || doc.model) {
    default:
      doc.__typename = "Song";
  }
  delete doc.model;
  // if (!rawDoc) {
  //   for (let song of doc.songs || []) {
  //     addFieldsToDoc(song, req, rawDoc);
  //   }
  // }
  return doc;
};

const getTrending = async (modelName, args = {}) => {
  switch (modelName) {
    case "artist":
      args.priority = ROLE.ARTIST;
      modelName = "users";
      break;
    default:
      break;
  }
  args._sortOp = args.sortOp;
  delete args.sortOp;
  args.pagination = {
    next: "",
    ...args.pagination,
  };
  const [queryNext, observeNext] = args.pagination.next.split(".");
  let queryAnalytics = {
    data: [],
  };
  let observeAnalytics = {
    data: [],
  };
  if (queryNext || (!queryNext && !observeNext)) {
    args.pagination.next = queryNext;
    queryAnalytics = await getAnalyticsSortedArray("query", modelName, args);
  }
  if (observeNext || (!queryNext && !observeNext)) {
    args.pagination.next = observeNext;
    observeAnalytics = await getAnalyticsSortedArray(
      "observe",
      modelName,
      args
    );
  }
  let stat = {};
  let result = [];
  for (let ana of queryAnalytics.data.concat(observeAnalytics.data)) {
    if (!stat[ana.doc]) {
      stat[ana.doc] = getStat(ana["ips"]);
    } else {
      const _stat = getStat(ana["ips"]);
      stat[ana.doc].today += _stat.today;
      stat[ana.doc].prev += _stat.prev;
    }
    if (stat[ana.doc].updatedAt) continue;
    await ana.populate({
      model: modelName,
      path: "doc",
    });
    stat[ana.doc._id].updatedAt = ana.updatedAt;
    result.push(await addFieldsToDoc(ana.doc, args.userId, args.rawDoc));
  }
  sortAnalytics(result, args._sortOp, stat, args.applySortProximity);
  // for (let i = 0; i < 3; i++) {
  //   result = result.concat(result);
  // }
  // console.log("done cal trending... ", modelName, " result  ", result.length);

  return {
    data: result,
    pagination: {
      total: result.length,
      hasNext:
        queryAnalytics.pagination.hasNext ||
        observeAnalytics.pagination.hasNext,
      next: `${queryAnalytics.pagination.next}.${observeAnalytics.pagination.next}`,
    },
    group: args.group,
  };
};
module.exports = {
  authenticate,
  addFieldsToDoc,
  getTrending,
  async getAnalyticsReport({ report, ...args }) {
    console.log("getting report... ", report, args.category, args.userId);
    report = report.split(" ");
    args.category = args.category ? args.category.split(" ") : ["hot"];
    args.pagination = {
      next: "",
      ...args.pagination,
    };
    let reports = {};
    for (let i in report) {
      args.sortOp = args.category[i] || "hot";
      switch (report[i]) {
        case "topSearchedSongs":
          reports["topSearchedSongs"] = await getAnalyticsSortedArray(
            "query",
            "songs",
            args
          );
          break;
        case "topSearchedArtists":
          reports["topSearchedArtists"] = await getAnalyticsSortedArray(
            "query",
            "artists",
            args
          );
          break;
        case "topSearchedPlaylists":
          reports["topSearchedPlaylists"] = await getAnalyticsSortedArray(
            "query",
            "playlists",
            args
          );
          break;
        case "topSearchedAlbums":
          reports["topSearchedAlbums"] = await getAnalyticsSortedArray(
            "query",
            "albums",
            args
          );
          break;
        case "trendingSongs":
          reports["trendingSongs"] = await getTrending("songs", args);
          break;
        case "trendingArtists":
          reports["trendingArtists"] = await getTrending("artists", args);
          break;
        case "trendingPlaylists":
          reports["trendingPlaylists"] = await getTrending("playlists", args);
          break;
        case "trendingAlbums":
          reports["trendingAlbums"] = await getTrending("albums", args);
          break;
        default:
          continue;
      }
    }
    console.log("now report... ", report, args.category);
    return reports;
  },
};
