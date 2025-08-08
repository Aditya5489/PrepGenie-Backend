const express = require('express');
const router = express.Router();
const { getUserResumes,deleteResume } = require('../controller/history.controller');

router.get('/user/:userId', getUserResumes);
router.delete('/:resumeId', deleteResume);

module.exports = router;
