const express = require('express');
const router = express.Router();
const { upload, analyzeResume } = require('../controller/resume.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware'); 

router.post('/upload', ensureAuthenticated, upload, analyzeResume); 

module.exports = router;
