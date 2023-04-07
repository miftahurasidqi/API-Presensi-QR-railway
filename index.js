const express = require("express");
const mongoose = require("mongoose");
const expressWs = require("express-ws");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const rutePegawai = require("./routes/rutePegawai");
// const ruteKehadiran = require("./routes/ruteKehadiran");

dotenv.config();

const app = express();
expressWs(app);

app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.use("/pegawai", rutePegawai);
// app.use("/kehadiran", ruteKehadiran);

const PORT = 3280;

mongoose
  .connect("mongodb+srv://miftahurasidqi:Cedm4Ip6XI4f5kSy@cluster0.d3dl5wx.mongodb.net/presensi_QR_1")
  .then(() => {
    console.log("Terhubung dengan MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Gagal terhubung dengan MongoDB:", err);
  });
