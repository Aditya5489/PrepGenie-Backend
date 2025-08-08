const User = require('../models/user.model.js');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Function to upload stream to Cloudinary
    const streamUpload = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "profile_images" },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
      });
    };

    // Upload the image
    const uploadResult = await streamUpload(req.file.buffer);

    // Update user profile in DB
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: uploadResult.secure_url },
      { new: true }
    );

    res.json({
      message: "Profile image updated successfully",
      profileImage: updatedUser.profileImage
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { uploadProfileImage };
