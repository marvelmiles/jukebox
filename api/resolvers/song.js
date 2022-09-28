const { UserInputError, AuthenticationError } = require("apollo-server-core");
const mongoose = require("mongoose");
const multer = require("multer");
const {
  BACKEND_URL,
  AUDIO_TYPE,
  AUDIO_HOST_TYPE,
  IMAGE_COVER_TYPE,
  IMAGE_HOST_COVER_TYPE,
} = require("../config");
const { authenticate, isFavourite, addFieldsToDoc } = require("../context");
const {
  storeFS,
  deleteFile,
  createFilePath,
  uniq,
  getMusicMetaData,
  isToday,
  getTrending,
  deleteFileAndUpload,
  getAll,
} = require("../helpers");
const Songs = require("../models/Songs");
const path = require("path");
const Users = require("../models/Users");
const Albums = require("../models/Albums");
const fs = require("fs");
const Analytics = require("../models/Analytics");
const Playlists = require("../models/Playlists");
module.exports = {
  Query: {
    async getTrendingSongs(_, args) {
      console.log("getting trending song...", args);
      return await getTrending("songs", args);
    },
    async getGenres() {
      return [];
    },
    async getSongs(_, __, { handleError }) {
      try {
        return await Songs.find({
          status: "public",
        });
      } catch (err) {
        handleError(err);
      }
    },
    async getSongById(_, { id }, { req }) {
      try {
        console.log("song by id..");
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("faulty id");

        return addFieldsToDoc(
          await Songs.findById(id),
          req,
          false,
          "Song doesn't exit"
        );
      } catch (err) {
        throw err;
      }
    },
    async getSongPrimaryDataById(_, { id }) {
      try {
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("faulty id...");
        id = await Songs.findById(id);
        if (!(id && id.src)) return new UserInputError("Song not found...");
        const metadata = await getMusicMetaData(
          fs.createReadStream(createFilePath(null, id.src))
        );
        //learn-music
        const _coverName = uniq() + "." + metadata.picture.format.split("/")[1];
        const _coverPath = createFilePath(IMAGE_COVER_TYPE, _coverName);
        await storeFS(metadata.picture.data, _coverPath);
        return {
          id: id.id,
          albumId: id.albumId,
          owner: id.owner,
          src: id.src,
          year: id.year,
          uploadedAt: id.uploadedAt,
          createdAt: id.createdAt,
          cover: createFilePath(IMAGE_HOST_COVER_TYPE, _coverName),
          duration: metadata.duration,
          album: metadata.album,
          track: metadata.track.no,
          albumTracks: metadata.track.of,
          genre: metadata.genre?.join(",") || "",
          artists: metadata.artists,
          artist: metadata.artist,
          title: metadata.title,
        };
      } catch (err) {
        throw err;
      }
    },
    // learn
    async getUserSongs(_, { pagination }, { req, res }) {
      try {
        //console.log("getting songs...");
        await authenticate(req);
        return await getAll(Songs, pagination, {
          owner: req.user.id,
        });
      } catch (err) {
        throw err;
      }
    },
    async getSong(_, { id }, { handleError }) {
      try {
        if (!mongoose.isValidObjectId(id)) handleError("Request is faulty");
        return await Songs.findById(id);
      } catch (err) {
        handleError(err);
      }
    },
  },
  Mutation: {
    async sd() {
      //console.log("sdddddddddddd");
      return [];
    },
    async updateSongById(_, args, { req }) {
      try {
        console.log("updating song...");
        if (!mongoose.isValidObjectId(args.id))
          throw new UserInputError("Faulty id");
        await authenticate(req);
        const song = await Songs.findById(args.id);
        if (!song) throw new UserInputError("Song not found");
        args.cover &&
          (args.cover = await deleteFileAndUpload(
            args.cover,
            req.user.username,
            song.src
          ));
        await Songs.updateOne({ _id: song.id }, args);
        return "Updated song successfully";
      } catch (err) {
        throw err;
      }
    },
    // async saveSong(_, { title, album, tags, language, category, status }) {
    //   try {
    //     authenticate(req, handleError);
    //     const song = new Songs({
    //       title,
    //       album,
    //       tags,
    //       language,
    //       category,
    //       status,
    //     });
    //     await song.save();
    //   } catch (err) {
    //     handleError(err);
    //   }
    // },
    async updateSong(_, { id, ...body }, { req }) {
      let _cover;
      try {
        //console.log("updating song...", id);
        if (!mongoose.isValidObjectId(id))
          throw new UserInputError("Request is  faulty");
        await authenticate(req);
        const song = await Songs.findById(id);
        if (!song || song.owner.toString() !== req.user.id)
          throw new AuthenticationError("unauthorized access");
        if (body.cover && body.cover.file) {
          const filename = uniq() + path.extname(body.cover.file.filename);
          _cover = createFilePath(
            IMAGE_COVER_TYPE,
            filename,
            req.user.username
          );
          await storeFS(body.cover.file.createReadStream(), _cover);
          body.cover = createFilePath(
            IMAGE_HOST_COVER_TYPE,
            filename,
            req.user.username
          );
          deleteFile(
            createFilePath(IMAGE_COVER_TYPE, song.cover, req.user.username)
          );
        }
        if (body.artist) {
          if (!mongoose.isValidObjectId(body.artist)) {
            body.songArtist = body.artist;
            body.artist = null;
          }
        }
        body.tyy = body.features;
        await Songs.updateOne(
          {
            _id: id,
          },
          body
          // { new: true }
        );
        return `Updated ${song.title} successfully`;
      } catch (err) {
        _cover && deleteFile(_cover);
        throw err;
      }
    },
    async deleteSongs(_, { songs }, { req }) {
      try {
        //console.log("deleting...");
        await authenticate(req);
        let err = "";
        for (let i = 0; i < songs.length; i++) {
          if (!mongoose.isValidObjectId(songs[i])) {
            err = err + songs[i] + " ";
            continue;
          }
          songs[i] = await Songs.findById(songs[i]);
          if (!songs[i]) continue;
          if (songs[i].owner.toString() !== req.user.id) {
            throw new AuthenticationError("Unauthorized access");
            break;
          }
          await Songs.deleteOne({
            _id: songs[i].id,
          });
          await Analytics.deleteMany({
            doc: songs[i].id,
          });
          req.user.recentPlays.songs.filter((s) => s.id === songs[i].id);
          await Users.findOneAndUpdate(
            {
              _id: req.user.id,
            },
            req.user
          );
          deleteFile(
            createFilePath(AUDIO_TYPE, songs[i].src, req.user.username)
          );
          deleteFile(
            createFilePath(IMAGE_COVER_TYPE, songs[i].cover, req.user.username)
          );
        }
        return err
          ? "Can't delete " + err + "bad id"
          : `Deleted songs successfully`;
      } catch (err) {
        throw err;
      }
    },
    // learn
    async uploadSongs(_, { songs, group, genre }, { req }) {
      let storedSongs = [],
        warnings = {
          queue: [],
        };
      try {
        //console.log("uploading songss....");
        await authenticate(req);
        console.log(songs[0]?.file, "songs......");
        if (!songs.length)
          throw new UserInputError(
            "Expect a file list [File] got type " + typeof songs
          );
        for (let i = 0; i < songs.length; i++) {
          const { createReadStream, filename, mimetype } = songs[i]?.file || {};
          if (!createReadStream) {
            //console.log("encountererrr error while uploading..");
            warnings.queue.push(
              `Encountered error while uploading ${song.title}`
            );
            continue;
          }
          const metadata = await getMusicMetaData(createReadStream());
          let song = await Songs.findOne({
            album: metadata.album,
            title: metadata.title,
            owner: req.user.id,
          });
          if (!song) {
            const _audioName = uniq() + path.extname(filename);
            const _audioPath = createFilePath(
              AUDIO_TYPE,
              _audioName,
              req.user.username
            );
            //learn-music
            await storeFS(createReadStream(), _audioPath);
            let _coverPath = "",
              _coverName = "";
            if (metadata.picture) {
              _coverName = uniq() + "." + metadata.picture.format.split("/")[1];
              _coverPath = createFilePath(
                IMAGE_COVER_TYPE,
                _coverName,
                req.user.username
              );
              await storeFS(metadata.picture.data, _coverPath);
              _coverName = createFilePath(
                IMAGE_HOST_COVER_TYPE,
                _coverName,
                req.user.username
              );
            }
            storedSongs.push({
              src: _audioPath,
              cover: _coverPath,
            });
            song = new Songs({
              mimetype,
              title: metadata.title,
              album: metadata.album,
              duration: metadata.duration,
              cover: _coverName,
              src: createFilePath(
                AUDIO_HOST_TYPE,
                _audioName,
                req.user.username
              ),
              artist: metadata.artist || metadata.albumartist,
              genre: metadata.genre ? metadata.genre.join(",") : "",
              year: metadata.year,
              track: metadata.track.no,
              albumTracks: metadata.track.of,
              uploadedAt: new Date(),
              owner: req.user.id,
            });
            let album = await Albums.findOneAndUpdate(
              {
                name: song.album,
              },
              {
                $push: {
                  songs: song.id,
                },
              }
            );
            if (!album && song.album) {
              album = new Albums({
                name: song.album,
                songs: [song.id],
                cover: metadata.albumPicture,
                artist: metadata.albumartist,
                owner: req.user.id,
                defaultInfo: {
                  name: song.album,
                  cover: metadata.albumPicture,
                  artist: metadata.albumartist,
                },
              });
              await album.save();
            }
            song.albumId = album ? album.id : "";
            songs[i] = await song.save();
            songs[i].isFavourite = false;
            song.title !== filename &&
              warnings.queue.push(
                `Track file ${filename} saved as ${song.title}`
              );
          } else {
            warnings.strict = true;
            warnings.queue.push(
              `Track file ${filename} exist. Track stored has ${song.title} in album ${song.album}`
            );
          }
        }
        if (warnings.strict)
          throw new UserInputError(warnings.queue.join("\n"));
        storedSongs = undefined;
        console.log("upload succ");
        return {
          data: songs,
          extraInfo: warnings.queue.length
            ? warnings.queue.join("\n")
            : "Upload songs successfully",
        };
      } catch (err) {
        storedSongs.forEach((f) => {
          deleteFile(f.src);
          deleteFile(f.cover);
        });
        throw err;
      }
    },
    async uploadSongsToCollectionsById(
      _,
      { songs, collections, type },
      { req }
    ) {
      try {
        const warnings = [];
        const success = [];
        const uploadSongs = async (Collection, _id) => {
          (
            await Collection.findOneAndUpdate(
              {
                _id,
              },
              {
                songs,
              },
              { new: true }
            )
          )?._id
            ? success.push(_id)
            : warnings.push(`Failed to upload songs to collection ${_id}.`);
        };
        if (!collections.length) warnings.push();
        await authenticate(req);
        for (let id of collections) {
          switch (type.toLowerCase()) {
            case "albums":
              await uploadSongs(Albums, id);
              break;
            case "playlists":
              await uploadSongs(Playlists, id);
              break;
          }
        }
        return {
          success,
          warnings,
        };
      } catch (err) {
        throw err;
      }
    },
  },
};
