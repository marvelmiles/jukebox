const mongoose = require("mongoose");
const { IMAGE_COVER_TYPE } = require("../config");
const schema = mongoose.Schema(
  {
    owner: { type: mongoose.Types.ObjectId, ref: "users" },
    name: {
      type: String,
      required: "Playlist name is reuired",
    },
    status: {
      type: String,
      default: "private",
    },
    count: {
      type: Number,
      default: 0,
    },
    songs: [
      {
        type: mongoose.Types.ObjectId,
        ref: "songs",
        set(item) {
          this.count++;
          return item;
        },
        required: "Empty list not allowed",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_, ret) {
        delete ret._id;
      },
    },
  }
);

schema.virtual("isFavourite").get(function () {
  return this.favourites?.playlists?.includes(this.id) || false;
});
module.exports = mongoose.model("playlists", schema);
