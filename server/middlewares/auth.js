const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../model/user.model");
const VerifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(402).json({
        success: false,
        message: "Token not found",
      });
    }

    const decodeToken = jwt.verify(token, process.env.SECRET_ACCESS_KEY);

    const user = await User.findById(decodeToken?.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { VerifyJWT };
