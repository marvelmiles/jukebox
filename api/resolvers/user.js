const { UserInputError } = require("apollo-server-core");
const mongoose = require("mongoose");
const { authenticate } = require("../context");
const Users = require("../models/Users");
const Favourites = require("../models/Favourites");
const {
  addToMediaCollectionSet,
  removeFromMediaCollectionSet,
  getTrendingArtists,
  getTrending,
} = require("../helpers");

module.exports = {
  Query: {
    async getTrendingArtists(_, args) {
      console.log("get trending artists...");
      return await getTrending("artist", args);
    },
    async deleteUser(_, __, { handleError, req }) {
      try {
        if (!mongoose.isValidObjectId(id)) handleError("Request is faulty");
        await authenticate(req, handleError);
        const user = await Users.findByIdAndDelete(req.user);
        if (!user) handleError("User not found");
        return `Deleted ${user.name} successfully`;
      } catch (err) {
        handleError(err);
      }
    },
    async getLastListening(_, __, { req, handleError }) {
      try {
        await authenticate(req, handleError);
        return (await Users.findById(req.user)).lastListening;
      } catch (err) {
        handleError(err);
      }
    },
    async getUserFavourites(_, { mediaCollectionType }, { req }) {
      console.log("getting favs");
      await authenticate(req);
      return (
        await req.user.populate([
          {
            path: `favourites.${mediaCollectionType}`,
            model: mediaCollectionType,
          },
        ])
      ).favourites[mediaCollectionType];
    },
    async getUserRecentPlays(
      _,
      { mediaCollectionType, operation = "all" },
      { req }
    ) {
      try {
        await authenticate(req);
        console.log("getting recent plays.. ", mediaCollectionType);
        const getSongs = async () => {
          let songs = (
            await req.user.populate([
              {
                path: "recentPlays.songs",
                model: "songs",
              },
            ])
          ).recentPlays.songs;
          if (operation === "local") {
            return songs.filter((s) => {
              return s.owner.toString() === req.user.id || s.downloaded;
            });
          } else return songs;
        };
        switch (mediaCollectionType) {
          case "songs":
            return await getSongs();
          case "radios":
            return [];
          default:
            return [];
        }
      } catch (err) {
        throw err;
      }
    },
    async isUserFavourite(_, { type, collection }, { req }) {
      try {
        console.log("iss");
        if (!/tracks|albums|playlists|radios/i.test(type))
          throw new UserInputError(
            `Incorrect type expect: tracks|albums|playlists`
          );
        await authenticate(req);
        if (!req.user.favourites[type]?.length) return false;
        return req.user.favourites[type].includes(collection);
      } catch (err) {
        throw err;
      }
    },
    async isFollowing(_, { id }, { req }) {
      try {
        await authenticate(req);
        return req.user.following.includes(id);
      } catch (err) {
        throw err;
      }
    },
  },
  Mutation: {
    async followUserById(_, { id }, { req }) {
      try {
        await authenticate(req);
        await Users.findByIdAndUpdate(req.user.id, {
          $push: {
            following: id,
          },
        });
        await Users.findByIdAndUpdate(id, {
          $push: {
            followers: req.user.id,
          },
        });
        return "Followed";
      } catch (err) {
        throw err;
      }
    },
    async unFollowUserById(_, { id }, { req }) {
      try {
        await authenticate(req);
        await Users.findByIdAndUpdate(req.user.id, {
          $pull: {
            following: id,
          },
        });
        return "Unfollowed";
      } catch (err) {
        throw err;
      }
    },
    async updateUser(_, args, { req, handleError }) {
      try {
        await authenticate(req, handleError);
        await Users.findByIdAndUpdate(req.user, args);
        return `Updated account succesffully`;
      } catch (err) {
        handleError(err);
      }
    },
    async saveUserRecentPlays(_, { mediaCollection }, { req }) {
      try {
        // console.log("saving recent plays", mediaCollection);
        await authenticate(req);
        await addToMediaCollectionSet(
          "recentPlays",
          mediaCollection,
          req.user.id,
          Users
        );
        return "Updated recent plays successfully";
      } catch (err) {
        throw err;
      }
    },
    async followUserById(_, { id }, { req }) {
      if (!mongoose.isValidObjectId(id)) throw new UserInputError("Faulty id");
      await authenticate(req);
      const user = await Users.findByIdAndUpdate(id, {
        $push: {
          followers: req.user.id,
        },
      });
      if (!user) throw UserInputError("User not found");
      return "Followed";
    },
    async addToUserFavourite(_, { mediaCollection }, { req }) {
      try {
        console.log("adding fav", mediaCollection);
        await authenticate(req);
        await addToMediaCollectionSet(
          "favourites",
          mediaCollection,
          req.user.id,
          Users
        );
        return "Added to favourite successfully";
      } catch (err) {
        throw err;
      }
    },
    async removeFromUserFavourite(_, { mediaCollection }, { req }) {
      try {
        console.log("removing...", mediaCollection);
        await authenticate(req);
        await removeFromMediaCollectionSet(
          "favourites",
          mediaCollection,
          req.user.id,
          Users
        );
        return "Removed successfully";
      } catch (err) {
        throw err;
      }
    },
  },
};
// Accessing non-existent property 'Symbol(Symbol.iterator)' of module exports inside circular dependency
