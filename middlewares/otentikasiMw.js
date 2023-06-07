const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const bearerHeaders = req.headers.authorization;
  if (bearerHeaders == null) return res.sendStatus(401);
  jwt.verify(bearerHeaders, process.env.JWT_SECRET, (error, decoded) => {
    if (error) return res.sendStatus(403);
    req.user = decoded;
    console.log("verifi Sukses");
    next();
  });
};

const hanyaAdmin = (req, res, next) => {
  const peran = req.user.peran; // Change with your own authentication mechanism
  if (peran !== "admin") {
    return res.status(403).json({ message: "Anda Bukan Admin" });
  }
  console.log("Admin");

  next();
};

const hanyaPegawai = (req, res, next) => {
  const peran = req.user.peran; // Change with your own authentication mechanism
  if (peran !== "pegawai") {
    return res.status(403).json({ message: "Anda Bukan Pegawai" });
  }
  console.log("Pegawai");
  next();
};

module.exports = { verifyToken, hanyaAdmin, hanyaPegawai };
