const mongoose = require("mongoose");

const schema = mongoose.Schema(
  {
    country: String,
    city: String,
    modelRef: String,
    ips: Object,
    operation: String,
    doc: mongoose.Types.ObjectId,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("analytics", schema);
