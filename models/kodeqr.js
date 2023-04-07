const mongoose = require("mongoose");
const { Schema } = mongoose;

const kodeqrSchema = new Schema({
  kode: { type: String, required: true, unique: true },
  tanggal: { type: Date, required: true, default: Date.now },
});

module.exports = mongoose.model("KodeQr", kodeqrSchema, "kodeqr");
