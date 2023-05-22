const mongoose = require("mongoose");
const { Schema } = mongoose;

const skemaKehadiran = new Schema({
  pegawai: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pegawai",
    required: true,
  },
  datang: {
    type: Date,
    required: true,
  },
  pulang: {
    type: Date,
    required: false,
  },
});

module.exports = mongoose.model("Kehadiran", skemaKehadiran);
