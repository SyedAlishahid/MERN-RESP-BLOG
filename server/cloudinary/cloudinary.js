const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const VideoUploader = async (file) => {
  try {
    if (!file) return null;

    const response = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });

    // remove local file after upload
    fs.unlinkSync(file);

    return response; // IMPORTANT
  } catch (error) {
    if (file) {
      try {
        fs.unlinkSync(file);
      } catch {}
    }
    return null;
  }
};

module.exports = { VideoUploader };
