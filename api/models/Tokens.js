const mongoose = require("mongoose");
const schema = mongoose.Schema(
  {
    token: {
      type: String,
      required: "String is required",
    },
    user: { type: mongoose.Types.ObjectId, ref: "users" },
    expiresIn: Date,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("tokens", schema);
