const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.body.token;
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
};

const hanyaAdmin = (req, res, next) => {
  const peran = req.user.peran; // Change with your own authentication mechanism
  if (peran !== "admin") {
    return res.status(403).json({ message: "Anda Bukan Admin" });
  }

  next();
};

const hanyaPegawai = (req, res, next) => {
  const peran = req.user.peran; // Change with your own authentication mechanism
  if (peran !== "pegawai") {
    return res.status(403).json({ message: "Anda Bukan Pegawai" });
  }
  next();
};

module.exports = { verifyToken, hanyaAdmin, hanyaPegawai };
