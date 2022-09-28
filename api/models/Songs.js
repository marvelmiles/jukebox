const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    title: String,
    mimetype: String,
    artist: String,
    duration: Number,
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: "Owner id is required",
    },
    album: String,
    albumId: String,
    genre: String,
    src: String,
    cover: String,
    track: Number,
    albumTracks: Number,
    year: Number,
    coverDesc: String,
    uploadedAt: {
      type: Number,
      default: new Date().getTime(),
    },
    streams: Number,
    repeatCount: Number,
    downloads: Number,
    stat: Object,
  },
  {
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        delete ret._id;
      },
    },
  }
);
schema.methods = {
  isDownloaded() {
    console.log("is fodww");
    return this.downloads > 0;
  },
};
// schema.virtual("isFavourite").get(function () {
//   console.log("ddd");
//   return this.favourites?.songs?.includes(this.id) || false;
// });

module.exports = mongoose.model("songs", schema);
