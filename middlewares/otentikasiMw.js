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

const aksesPeran = (req, res, next) => {
  const peran = req.user.peran; // Change with your own authentication mechanism
  if (peran !== "admin") {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

module.exports = { verifyToken, aksesPeran };
