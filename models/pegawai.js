const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  nama: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  nip: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  peran: {
    type: String,
    enum: ["pegawai", "admin"],
    default: "pegawai",
  },
});
//
module.exports = mongoose.model("Pegawai", UserSchema);
