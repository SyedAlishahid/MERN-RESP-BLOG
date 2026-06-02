const mongoose = require("mongoose");
const User = require("../model/user.model.js");
const { VideoUploader } = require("../cloudinary/cloudinary.js");
const sendEmail = require("../middlewares/nodemailer.js");
const dotenv = require("dotenv");
const Blog = require("../model/blog.model.js");

dotenv.config();
async function generateToken(id) {
  try {
    const userinfo = await User.findById(id); // FIXED

    if (!userinfo) {
      throw new Error("User not found");
    }

    const accessToken = userinfo.generateToken(); // FIXED
    const refreshToken = userinfo.generateRefreshToken(); // FIXED

    userinfo.refreshToken = refreshToken; // FIXED

    await userinfo.save({ validateBeforeSave: false }); // FIXED

    return { accessToken, refreshToken };
  } catch (error) {
    console.log("Token generation error:", error.message);
    throw error;
  }
}

const signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(500).json({
        message: "All feilds are mandotory",
        success: false,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(500).json({
        message: "User already exist",
        success: false,
      });
    }

    const profileImg = req.files.profile?.[0]?.path;

    if (!profileImg) {
      return res.status(500).json({
        message: "Image not found",
        success: false,
      });
    }

    const uploadOnCloudinary = await VideoUploader(profileImg);

    const newUser = await User.create({
      username,
      email,
      password,
      profile: uploadOnCloudinary.url,
    });

    const hideCreds = await User.findById(newUser.id).select(
      "-password -refreshToken",
    );

    return res.status(200).json({
      success: true,
      user: hideCreds,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(500).json({
        message: "All feilds are mandotory",
        success: false,
      });
    }

    const userInfo = await User.findOne({ email });

    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "Email not found!",
      });
    }
    const passChecker = await userInfo.comparePassword(password);

    console.log(passChecker);
    if (!passChecker) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password!",
      });
    }

    const hideCreds = await User.findById(userInfo.id).select(
      "-password -refreshToken",
    );
    const { accessToken, refreshToken } = await generateToken(userInfo.id);

    const opt = {
      secure: true,
      httpOnly: true,
    };
    userInfo.lastLogin = new Date();
    await userInfo.save();
    return res
      .status(200)
      .cookie("accessToken", accessToken, opt)
      .cookie("refreshToken", refreshToken, opt)
      .json({
        success: true,
        user: hideCreds,
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const logout = async (req, res) => {
  try {
    const userInfo = req.user;

    console.log(userInfo);

    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User info not found!",
      });
    }
    const { accessToken, refreshToken } = generateToken(userInfo._id);

    const opt = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", accessToken, opt)
      .clearCookie("refreshToken", refreshToken, opt)
      .json({
        success: true,
        message: "User log out successfully",
      });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User info not found!",
      });
    }

    const deleteUser = await User.findByIdAndDelete(req.user.id);
    if (!deleteUser) {
      return res.status(400).json({
        success: false,
        message: "User cant be deleted!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User successfully deleted",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const userDetails = async (req, res) => {
  try {
    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User info not found!",
      });
    }

    return res.status(200).json({
      success: true,
      payload: userInfo,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const changePicture = async (req, res) => {
  try {
    const newProfileImg = req.files.NewProfile?.[0]?.path;
    const { userId } = req.params;

    if (!userId) {
      return res.status(500).json({
        message: "Id not found",
        success: false,
      });
    }

    const uploadNewImage = await VideoUploader(newProfileImg);

    if (!uploadNewImage) {
      return res.status(400).json({
        message: "Cant upload on cloudinary~",
        success: false,
      });
    }

    const findNupdate = await User.findByIdAndUpdate(
      userId,
      {
        profile: uploadNewImage.secure_url,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!findNupdate) {
      return res.status(404).json({
        success: false,
        message: "image not updated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image updated successfully",
      NewProfile: findNupdate,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldpassword, newpassword } = req.body;

    if (!oldpassword || !newpassword) {
      return res.status(500).json({
        message: "All feilds are mandotory",
        success: false,
      });
    }

    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User info not found!",
      });
    }
    const checkPassword = await userInfo.comparePassword(oldpassword);
    if (!checkPassword) {
      return res.status(400).json({
        success: false,
        message: "Wrong password!",
      });
    }

    req.user.password = newpassword;
    await req.user.save();
    return res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User info not found!",
      });
    }

    const generateOtp = Math.floor(100000 + Math.random() * 900000);
    userInfo.emailVerificationToken = generateOtp;
    await userInfo.save();

    const email = await sendEmail({
      email: userInfo.email,
      subject: "Verification Email",
      message: `Your OTP is ${generateOtp}`,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const otpVerify = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "Otp is not found",
      });
    }
    const userInfo = req.user;
    if (!userInfo) {
      return res.status(400).json({
        success: false,
        message: "User info not found!",
      });
    }

    if (otp !== userInfo.emailVerificationToken) {
      return res.status(500).json({
        message: "Invalid otp",
        success: false,
      });
    }

    userInfo.accountverified = true;
    await userInfo.save();
    return res.status(200).json({
      accountStatus: userInfo.accountverified,
      message: "Your account is verified!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

//Blog Controllers

const createBlog = async (req, res) => {
  console.log(req.body);
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(500).json({
        message: "All feilds are mandotory",
        success: false,
      });
    }

    if (description.length < 120) {
      return res.status(500).json({
        message: "Your blog cant be create because of short description",
        success: false,
      });
    }
    const blogImg = req.files.image?.[0]?.path;

    if (!blogImg) {
      return res.status(500).json({
        message: "Image not found",
        success: false,
      });
    }
    const uploadOnCloudinary = await VideoUploader(blogImg);

    const blog = await Blog.create({
      title,
      image: uploadOnCloudinary.secure_url,
      description,
      createdby: req.user._id,
    });

    req.user.posts.push(blog._id);
    req.user.save();
    return res.status(200).json({
      blog,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const { deleteBlg } = req.params;

    if (!deleteBlg) {
      return res.status(400).json({
        success: false,
        message: "Id not found in url",
      });
    }

    const findBlog = await Blog.findByIdAndDelete(deleteBlg);

    if (!findBlog) {
      return res.status(400).json({
        success: false,
        message: "Id not found in url",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog deleted Successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const editBlog = async (req, res) => {
  console.log(req.body);
  try {
    const { newTitle, newDescription } = req.body;
    const { blogId } = req.params;

    // check blogId
    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required",
      });
    }

    // if nothing is provided
    if (!newTitle && !newDescription) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    let updateData = {};

    // only title
    if (newTitle && !newDescription) {
      updateData.title = newTitle;
    }

    // only description
    else if (!newTitle && newDescription) {
      updateData.description = newDescription;
    }

    // both
    else if (newTitle && newDescription) {
      updateData.title = newTitle;
      updateData.description = newDescription;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      updatedBlog,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const likeHandler = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const dislikeHandler = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const commentHandler = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const followHandler = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

const unfollowHandler = async (req, res) => {
  try {
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      success: false,
    });
  }
};

module.exports = {
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
};
