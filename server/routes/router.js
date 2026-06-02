const {
  signUp,
  login,
  logout,
  deleteAccount,
  userDetails,
  changePicture,
  changePassword,
  verifyEmail,
  otpVerify,
  createBlog,
  deleteBlog,
  editBlog,
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

router.post("/user", VerifyJWT, userDetails);

router.post(
  "/change-profile/:userId",
  upload.fields([{ name: "NewProfile", maxCount: 1 }]),
  VerifyJWT,
  changePicture,
);

router.post("/change-password", VerifyJWT, changePassword);

router.post("/generate-otp", VerifyJWT, verifyEmail);
router.post("/verify-otp", VerifyJWT, otpVerify);
router.post(
  "/create-blog",
  upload.fields([{ name: "image", maxCount: 1 }]),
  VerifyJWT,
  createBlog,
);

router.post("/delete-blog/:deleteBlg", VerifyJWT, deleteBlog);

router.post("/edit-blog/:blogId", VerifyJWT, editBlog);

module.exports = router;
