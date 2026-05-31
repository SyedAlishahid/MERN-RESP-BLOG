const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      require: true,
      unique: true,
      type: String,
    },
    image: {
      require: true,
      type: String,
    },
    description: {
      require: true,
      type: String,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
