const express = require("express");
const { login, profil, semuaPegawai, tambahPegawai } = require("../controllers/pegawaiCtr");
const { verifyToken, aksesPeran } = require("../middlewares/otentikasiMw");

const router = express.Router();

// router.post("/", otentikasiMw, aksesPeran("admin"), tambahPegawai);
// router.get("/", otentikasiMw, aksesPeran("admin"), semuaPegawai);
router.post("/", verifyToken, aksesPeran, tambahPegawai);
router.get("/", verifyToken, aksesPeran, semuaPegawai);
router.get("/profil", verifyToken, profil);
// router.get("/profil", verifyToken);
router.post("/login", login);

// Add more routers as needed

module.exports = router;
