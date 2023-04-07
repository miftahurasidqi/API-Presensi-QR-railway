const mongoose = require("mongoose");
const { Schema } = mongoose;

const skemaKehadiran = new Schema({
  pegawai: { type: mongoose.Schema.Types.ObjectId, ref: "Pegawai", required: true },
  datang: { type: Date, required: true, default: Date.now },
  pulang: { type: Date },
});

module.exports = mongoose.model("Kehadiran", skemaKehadiran, "kehadiran");
