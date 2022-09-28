const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    owner: { type: mongoose.Types.ObjectId, ref: "users" },
    name: {
      type: String,
      required: "Album is reuired",
    },
    status: {
      type: String,
      default: "private",
    },
    cover: {
      type: String,
      default: "",
    },
    songs: [
      {
        type: mongoose.Types.ObjectId,
        ref: "songs",
        set(v) {
          this.count++;
          return v;
        },
      },
    ],
    count: {
      type: Number,
      default: 0,
    },
    artist: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: "Owner id is required",
    },
    defaultInfo: Object,
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
  return this.favourites?.albums?.includes(this.id) || false;
});
module.exports = mongoose.model("albums", schema);
