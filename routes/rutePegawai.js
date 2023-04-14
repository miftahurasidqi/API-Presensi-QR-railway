const express = require("express");
const { login, profil, semuaPegawai, tambahPegawai } = require("../controllers/pegawaiCtr");
const { verifyToken, hanyaAdmin } = require("../middlewares/otentikasiMw");

const router = express.Router();

router.post("/", verifyToken, hanyaAdmin, tambahPegawai);
router.get("/", verifyToken, hanyaAdmin, semuaPegawai);
router.get("/me", verifyToken, profil);
router.post("/login", login);

// Add more routers as needed

module.exports = router;
