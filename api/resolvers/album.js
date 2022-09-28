const { UserInputError } = require("apollo-server-core");
const mongoose = require("mongoose");
const { authenticate, addFieldsToDoc } = require("../context");
const {
  storeFS,
  createFilePath,
  deleteFile,
  getTrendingAlbums,
  getTrending,
} = require("../helpers");
const Albums = require("../models/Albums");
const path = require("path");
const {
  BACKEND_URL,
  IMAGE_COVER_TYPE,
  IMAGE_HOST_COVER_TYPE,
  AUDIO_TYPE,
} = require("../config");
module.exports = {
  Query: {
    async getTrendingAlbums(_, args) {
      //console.log("gettrendin albums", args);
      return await getTrending("albums", args);
    },
    async getAlbums() {
      try {
        //console.log("gettign public albums");
        return await Albums.find({
          status: "public",
        });
      } catch (err) {
        throw err;
      }
    },
    async getAlbumDefaultInfoById(_, { id }, { req }) {
      //console.log("getting default info");
      if (!mongoose.isValidObjectId(id)) throw UserInputError("Faulty id");
      await authenticate(req);
      return (await Albums.findById(id)).defaultInfo;
    },
    async getUserAlbums(_, __, { req }) {
      try {
        //console.log("getting user albums...", Albums.name);
        await authenticate(req);
        return (await Albums.find({ owner: req.user.id })).map((doc) =>
          addFieldsToDoc(doc, req.user)
        );
      } catch (err) {
        throw err;
      }
    },
    async getAlbumsById(_, { id }, { req }) {
      try {
        //console.log("getting albums...");
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Request id is faulty");
        await authenticate(req);
        return await Albums.find({
          owner: id,
        });
      } catch (err) {
        throw err;
      }
    },
    async getAlbumById(_, { id }, { req }) {
      try {
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Request is faulty");
        await authenticate(req);
        const doc = await Albums.findById(id);
        const songs = (await doc.populate("songs")).songs;
        for (let index in songs) {
          await addFieldsToDoc(songs[index], req, false);
        }
        return doc;
      } catch (err) {
        throw err;
      }
    },
    async getAlbumSongsById(_, { id }) {
      try {
        if (!mongoose.isValidObjectId(id))
          throw UserInputError("Request is faulty");
        return (await Albums.findById(id).populate("songs")).songs;
      } catch (err) {
        throw err;
      }
    },
  },
  Mutation: {
    async deleteSongsFromAlbumById(_, { id, songs }, { req }) {
      try {
        //console.log("del song album");
        await authenticate(req);
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Faulty id");

        const album = await Albums.findById(id);
        if (album.songs) {
          songs.forEach(
            (s) =>
              (album.songs = album.songs.filter(
                (i) => i.toString() !== s.toString()
              ))
          );
        }
        await Albums.updateOne(
          {
            _id: id,
          },
          album
        );
        return "Deleted medias succesfully";
      } catch (err) {
        throw err;
      }
    },
    async saveAlbum(_, { name, cover, status, songs }, { req }) {
      try {
        //console.log("saving album....", songs);

        await authenticate(req);
        let album = await Albums.findOne({
          name,
          owner: req.user.id,
        });
        console.log(album);
        if (album)
          throw new UserInputError(
            "An album with same name has been created by you"
          );
        if (cover && cover.file) {
          await storeFS(
            cover.file.createReadStream(),
            createFilePath(
              IMAGE_COVER_TYPE,
              cover.file.filename,
              req.user.username
            )
          );
          cover = createFilePath(
            IMAGE_HOST_COVER_TYPE,
            cover.file.filename,
            req.user.username
          );
        } else cover = createFilePath(IMAGE_HOST_COVER_TYPE);
        album = new Albums({
          name,
          status,
          cover,
          songs,
          owner: req.user.id,
        });
        return await album.save();
      } catch (err) {
        throw err;
      }
    },
    async updateAlbumById(_, { id, cover, ...body }, { req }) {
      //console.log("updating album..");
      if (!mongoose.isValidObjectId(id))
        throw new UserInputError("Request is faulty");
      let album = await Albums.findById(id);
      if (!album) throw new UserInputError("Album doesn't exist");
      if (cover && cover.file) {
        await storeFS(
          cover.file.createReadStream(),
          createFilePath(
            IMAGE_COVER_TYPE,
            cover.file.filename,
            req.user.username
          )
        );
        deleteFile(createFilePath(AUDIO_TYPE, album.src, req.user.username));
      }

      await Albums.findByIdAndUpdate(
        id,
        {
          name: body.name,
          cover:
            cover &&
            createFilePath(
              IMAGE_HOST_COVER_TYPE,
              cover.file.filename,
              req.user.username
            ),
          $push: {
            songs: body.songs,
          },
          artist: body.artist,
        },
        { new: true }
      );
      return "Updated album successfully";
    },
    async deleteAlbumById(_, { id }, { req }) {
      //console.log("deleting album");
      try {
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Request is faulty");
        await authenticate(req);
        await Albums.findByIdAndDelete(id);
        return `Deleted album successfully`;
      } catch (err) {
        throw err;
      }
    },
  },
};
