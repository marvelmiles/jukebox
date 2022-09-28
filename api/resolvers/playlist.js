const { UserInputError } = require("apollo-server-core");
const mongoose = require("mongoose");
const { IMAGE_COVER_TYPE, IMAGE_HOST_COVER_TYPE } = require("../config");
const { authenticate, addFieldsToDoc } = require("../context");
const {
  uniq,
  storeFS,
  createFilePath,
  deleteFile,
  concatSongs,
  getTrendingPlaylists,
  getTrending,
  getAll,
} = require("../helpers");
const Playlists = require("../models/Playlists");
const path = require("path");
const Albums = require("../models/Albums");
const Songs = require("../models/Songs");
module.exports = {
  Query: {
    async getTrendingPlaylists(_, args) {
      return await getTrending("playlists", args);
    },
    async getUserPlaylists(_, { pagination }, { req }) {
      try {
        //console.log("getting playlists...");
        await authenticate(req);
        // const playlists = await Playlists.find(  );
        // // for (let index in playlists) {
        // //   await addFieldsToDoc(playlists[index], req);
        // // }
        return await getAll(Playlists, pagination, {
          owner: req.user.id,
        });
      } catch (err) {
        throw err;
      }
    },
    async getPlaylistById(_, { id }, { req }) {
      try {
        //console.log("gto playlist");
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Faulty req id");
        await authenticate(req);
        const playlist = await Playlists.findById(id).populate("songs");
        return await addFieldsToDoc(playlist, req.user);
      } catch (err) {
        throw err;
      }
    },
    async getPlaylistSongsById(_, { id }) {
      try {
        console.log("getting playlist soongs...");
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError(`Faulty id`);
        return (await Playlists.findById(id).populate("songs")).songs;
      } catch (err) {
        throw err;
      }
    },
  },
  Mutation: {
    async savePlaylist(_, args, { req }) {
      try {
        //console.log("saving playlist....");
        await authenticate(req);
        let playlist = await Playlists.findOne({
          name: args.name,
          owner: req.user.id,
        });
        if (playlist)
          throw new UserInputError(
            "A playlist with same name has been created by you"
          );
        args.owner = req.user.id;
        playlist = new Playlists(args);
        //console.log("saved play...");
        return await addFieldsToDoc(await playlist.save(), req);
      } catch (err) {
        throw err;
      }
    },
    async updatePlaylistById(_, { id, name, songs }, { req }) {
      try {
        console.log("updating playlist..");
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Request is faulty");

        await Playlists.findByIdAndUpdate(id, {
          name,
          $addToSet: {
            songs,
          },
        });
        //console.log("updated siccsuf.. pla");
        return `Updated playlist successfully`;
      } catch (err) {
        throw err;
      }
    },
    async deleteMediasFromPlaylistById(_, { id, medias }, { req }) {
      try {
        //console.log("del medi play");
        await authenticate(req);
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Faulty id");
        //console.log(medias);
        await Playlists.updateOne(
          { _id: id },
          {
            $pull: {
              playlist: {
                $in: medias,
              },
            },
          },
          { multi: true, new: true }
        );
        return "Deleted medias succesfully";
      } catch (err) {
        throw err;
      }
    },
    async deletePlaylistById(_, { id }, { req }) {
      try {
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Request id is faulty");
        await authenticate(req);
        await Playlists.findByIdAndDelete(id);
        return `Deleted playlist successfully`;
      } catch (err) {
        throw err;
      }
    },
    async renamePlaylist(_, { id, name }, { req, handleError }) {
      try {
        await authenticate(req, handleError);
        if (!mongoose.isValidObjectId(id)) handleError("Request is faulty");
        await Playlists.findByIdAndUpdate(id, {
          name,
        });
        return `Playlist renames successfully`;
      } catch (err) {
        handleError(err);
      }
    },
    async deletePlaylistSongs(_, { id, songs }, { req, handleError }) {
      try {
        await authenticate(req, handleError);
        if (!mongoose.isValidObjectId(id)) handleError("Request is faulty");
        const playlist = await Playlists.findById(id);
        if (!playlist) handleError("Playlist not found");
        let _songs = [];
        for (let i = 0; i < playlist.songs.length; i++) {
          let t = true;
          for (let j = 0; j < songs.length; j++) {
            if (songs[j] === playlist.songs[i]) {
              t = false;
              break;
            }
            if (t) _songs.push(playlist.songs[i]);
          }
        }
        playlist.songs = _songs;
        return `Playlist renames successfully`;
      } catch (err) {
        handleError(err);
      }
    },
  },
};
