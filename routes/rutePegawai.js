const express = require("express");
const { login, profil, semuaPegawai, tambahPegawai, edit, hapus } = require("../controllers/pegawaiCtr");
const { verifyToken, hanyaAdmin } = require("../middlewares/otentikasiMw");

const router = express.Router();

router.post("/", verifyToken, hanyaAdmin, tambahPegawai);
router.get("/", verifyToken, hanyaAdmin, semuaPegawai);
router.get("/me", verifyToken, profil);
router.post("/login", login);
router.patch("/update", verifyToken, hanyaAdmin, edit);
router.delete("/hapus", verifyToken, hanyaAdmin, hapus);

// Add more routers as needed

module.exports = router;
