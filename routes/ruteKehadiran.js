const express = require("express");
const { absen, semuaKehadiran, tampilkanKode } = require("../controllers/kehadiranCtr");
// const { otentikasiMw } = require("../middlewares/otentikasiMw");
// const { aksesPeran } = require("../middlewares/peranMw");

const rute = express.Router();

rute.get("/kode");
rute.post("/");
rute.get("/");

// Add more routes as needed

module.exports = rute;
