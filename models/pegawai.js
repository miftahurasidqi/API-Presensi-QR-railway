const mongoose = require("mongoose");
const { Schema } = mongoose;

const PegawaiSchema = new Schema({
  nama: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  peran: { type: String, enum: ["pegawai", "admin"], default: "pegawai" },
});

module.exports = mongoose.model("Pegawai", PegawaiSchema, "pegawai");
