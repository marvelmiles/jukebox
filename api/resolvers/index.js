const song = require("./song");
const auth = require("./auth");
const album = require("./album");
const user = require("./user");
const playlist = require("./playlist");
const radio = require("./radio");
const Songs = require("../models/Songs");
const {
  findQueryBuilder,
  getIp,
  isToday,
  getLocation,
  getTimeAgo,
  getTrendingArtists,
  getAllRadios,
  getTopSearchedSongs,
  getTopSearchedArtists,
  getAll,
  shuffleArray,
  runParallel,
} = require("../helpers");
const { isValidObjectId } = require("mongoose");
const { UserInputError } = require("apollo-server-core");
const { authenticate, getAnalyticsReport, getTrending } = require("../context");
const Analytics = require("../models/Analytics");
const Playlists = require("../models/Playlists");
const Users = require("../models/Users");
const { ROLE } = require("../config");
const Albums = require("../models/Albums");
const getDataCollections = async (array, args) => {
  const collections = [];
  for (let key of array) {
    switch (key) {
      case "topDownloads":
        collections.push(
          await getAll(
            Songs,
            {
              isDownloaded: true,
            },
            {
              sortRule: {
                downloads: -1,
              },
              group: key,
            }
          )
        );
        break;
      case "dailyTrending":
        collections.push(
          await getTrending("songs", {
            ...args,
            group: key,
          })
        );
        break;
    }
  }
  return collections;
};
module.exports = {
  RecentUnion: {
    __resolveType(obj) {
      // console.log(obj);
      if (obj.src !== undefined) return "Song";
      else if (obj.url !== undefined) return "Radio";
      else if (obj.artist !== undefined && obj.name !== undefined)
        return "Album";
      return "Playlist";
    },
  },

  QueryUnion: {
    __resolveType(obj) {
      // console.log("reslve query union..", obj);
      return "MediaCollectionSet";
    },
  },

  Query: {
    ...auth.Query,
    ...song.Query,
    ...album.Query,
    ...playlist.Query,
    ...user.Query,
    ...radio.Query,
    async getJukeMix(_, { mixin, userId, pagination }, {}) {
      try {
        const result = {};
        for (let key in mixin) {
          if (!result[key]) result[key] = [];
          const list = {
            usersChoice: ["topDownloads", "dailyTrending"],
          }[key];
          const args = {
            userId,
            pagination,
            applySortProximity: true,
          };
          if (mixin[key].length) {
            if (mixin[key][0] === "random") {
              result[key] = await getDataCollections(shuffleArray(list), args);
            } else result[key] = await getDataCollections(mixin[key], args);
          } else {
            result[key] = await getDataCollections(list, args);
          }

          continue;
          for (let report of mixin[key]) {
            switch (report) {
              case "topDownloads":

              // result[key] =
              case "dailyTrending":
              default:
                report = report.split("-");
                const query = {
                  country: report[1],
                  city: report[2],
                };
                if (key === "recommendation") {
                  if (!isValidObjectId(userId))
                    throw new UserInputError("Invalid userId");
                  userId = await Users.findById(userId);
                  let genres = "";
                  for (let key in userId.favourites.songs) {
                    key = await Songs.findById(userId.favourites.songs[key]);
                    if (!key) continue;
                    genres += key.genre + "_**_";
                  }
                  query.$or = [{ genre: { $in: genres.split("_**_") } }];
                }
                result[key][report[0]] = await getAll(
                  (() => {
                    if (report[0].indexOf("Songs")) return Songs;
                    else if (report[0].indexOf("Albums")) return Albums;
                    else
                      throw new UserInputError(
                        "Expect a query of topAlbums topPlaylists in charts"
                      );
                  })(),
                  query,
                  {
                    sortRule: {
                      streams: -1,
                      repeatCount: -1,
                      downloads: -1,
                    },
                  }
                );
            }
          }
        }
        // console.log(result.usersChoice);
        return result;
      } catch (err) {
        throw err;
      }
    },
    async getAnalyticsReport(_, args, { req }) {
      args.req = req;
      return await getAnalyticsReport(args);
    },
    async getQueryResult(_, { mediaCollectionType, query = "", pagination }) {
      console.log("getting query result... ", query, pagination);
      query = query.toLowerCase();
      if (mediaCollectionType) {
        switch (mediaCollectionType) {
          case "albums":
            return {
              albums: await getAll(Albums, pagination, findQueryBuilder(query)),
            };
          default:
            return {
              songs: await getAll(Songs, pagination, findQueryBuilder(query)),
            };
        }
      } else {
        const songs = await getAll(Songs, pagination, findQueryBuilder(query));
        const playlists = await getAll(
          Playlists,
          pagination,
          findQueryBuilder(query, "playlists")
        );
        const albums = await getAll(
          Albums,
          pagination,
          findQueryBuilder(query, "albums")
        );
        return {
          songs,
          playlists,
          albums,
        };
      }
    },
    async getNewReleases(_, { collection, limit, skip }) {
      console.log("getting new releases... ", collection);
      const set = {};
      switch (collection) {
        case "albums":
          set.albums = await Albums.find({
            createdAt: {
              $gte: getTimeAgo(),
            },
          });
          break;
        default:
          break;
      }
      return set;
    },
    async getRegionalDiscoveries(_, { limit, skip }) {
      return {
        trendingArtists: await getTrendingArtists(),
      };
    },
    async getRecentlyUpdated(_, { collection }) {
      console.log("getten recent");
      switch (collection) {
        default:
          return [].concat(
            await Albums.find({
              updatedAt: {
                $gte: getTimeAgo(),
              },
            }),
            await Playlists.find({
              updatedAt: {
                $gte: getTimeAgo(),
              },
            })
          );
      }
    },
  },
  Mutation: {
    ...auth.Mutation,
    ...song.Mutation,
    ...album.Mutation,
    ...playlist.Mutation,
    ...user.Mutation,
    ...radio.Mutation,
    async reportAnalytics(_, args, { req }) {
      try {
        console.log("reporting analy,..");
        if (!isValidObjectId(args.id))
          throw new UserInputError("Expect an object id...");
        const ip = getIp(req);
        const region = await getLocation();
        args.country = (args.country || region.country).toLowerCase();
        args.city = (args.city || region.city).toLowerCase();
        args.operation = args.operation.split(",");
        for (let op in args.operation) {
          op = args.operation[op];
          let analytics = await Analytics.findOne({
            operation: op,
            doc: args.id,
          });
          if (analytics) {
            if (analytics.ips[ip]) {
              if (!isToday(analytics.ips[ip])) analytics.ips[ip] = Date.now();
            } else analytics.ips[ip] = Date.now();
            await Analytics.updateOne(
              {
                _id: analytics.id,
              },
              {
                ...args,
                operation: op,
                ips: analytics.ips,
              }
            );
          } else {
            analytics = new Analytics({
              ips: {
                [ip]: Date.now(),
              },
              modelRef: args.collection,
              operation: op,
              doc: args.id,
              country: args.country,
              city: args.city,
            });
            await analytics.save();
          }
        }
        console.log("saved ana...");
        return "Saved successfully";
      } catch (err) {
        throw err;
      }
    },
  },
};
