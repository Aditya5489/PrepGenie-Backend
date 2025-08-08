const express = require('express');
const { uploadProfileImage } = require('../controller/profile.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const multer = require('multer');

const profileRouter = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST - Upload profile image
profileRouter.post('/upload-profile-pic', ensureAuthenticated, upload.single('profileImage'), uploadProfileImage);

module.exports = profileRouter;
