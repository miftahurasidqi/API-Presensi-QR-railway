const expressWs = require("express-ws");
const mongoose = require("mongoose");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");

const ruteKehadiran = require("./routes/ruteKehadiran");
const rutePegawai = require("./routes/rutePegawai");
const tes = require("./routes/tes");

dotenv.config();
const app = express();
expressWs(app);
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

app.use("/kehadiran", ruteKehadiran);
app.use("/pegawai", rutePegawai);
app.use("/", tes);

const PORT = 3280;
const ConectionsMongoDB = process.env.MONGO_URI;
const options = {
  useNewUrlParser: true, // Gunakan parser URL bar
  useUnifiedTopology: true, // Gunakan topologi server yang terpusa
};
// {
// connectTimeoutMS: 30000, // Atur waktu timeout (dalam milidetik)
// }
mongoose
  .connect(ConectionsMongoDB)
  .then(() => {
    console.log("Terhubung dengan MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Gagal terhubung dengan MongoDB:", err);
  });
