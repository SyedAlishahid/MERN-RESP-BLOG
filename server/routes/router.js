const {
  signUp,
  login,
  logout,
  deleteAccount,
  changePassword,
  verifyEmail,
  otpVerify,
  createBlog,
  deleteBlog,
} = require("../controller/controller");
const upload = require("../multer/multer.js");
const express = require("express");
const router = express.Router();
const { VerifyJWT } = require("../middlewares/auth.js");
router.post(
  "/signup",
  upload.fields([{ name: "profile", maxCount: 1 }]),
  signUp,
);

router.post("/login", login);

router.post("/logout", VerifyJWT, logout);
router.post("/delete-acc", VerifyJWT, deleteAccount);

router.post("/change-password", VerifyJWT, changePassword);

router.post("/generate-otp", VerifyJWT, verifyEmail);
router.post("/verify-otp", VerifyJWT, otpVerify);
router.post(
  "/create-blog",
  upload.fields([{ name: "image", maxCount: 1 }]),
  VerifyJWT,
  createBlog,
);

module.exports = router;
