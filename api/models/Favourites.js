const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "users",
      required: "Owner id is required",
    },
    favs: Object,
  },
  { timestamps: true }
);

module.exports = mongoose.model("favourites", schema);
