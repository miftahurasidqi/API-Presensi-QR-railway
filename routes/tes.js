const express = require("express");
const router = express.Router();
const tes = require("../controllers/tes");

router.get("/", tes);

// Add more routers as needed

module.exports = router;
