const express = require("express");
const { absen, semuaKehadiran, tampilkanKode } = require("../controllers/kehadiranCtr");
const { verifyToken, hanyaAdmin, hanyaPegawai } = require("../middlewares/otentikasiMw");

const router = express.Router();

router.get("/kode", verifyToken, hanyaAdmin, tampilkanKode);
router.get("/", verifyToken, hanyaAdmin, semuaKehadiran);
router.post("/", verifyToken, hanyaPegawai, absen);

// Add more routes as needed
// rute.get("/kode", otentikasiMw, aksesPeran('admin'), tampilkanKode);
// rute.post("/", otentikasiMw, aksesPeran('pegawai'), absen);
// rute.get("/", otentikasiMw, aksesPeran('admin'), semuaKehadiran);

module.exports = router;
