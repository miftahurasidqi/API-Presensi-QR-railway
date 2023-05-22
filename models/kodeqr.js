const mongoose = require("mongoose");
const { Schema } = mongoose;

const kodeqrSchema = new Schema({
  kode: {
    type: String,
    required: true,
    unique: true,
  },
  tanggal: {
    type: Date,
    required: true,
  },
  jenis: {
    type: String,
    required: true,
    enum: ["datang", "pulang"],
  },
});

module.exports = mongoose.model("KodeQr", kodeqrSchema);
