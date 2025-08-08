const express = require('express');
const { startInterview, handleAnswer } = require('../controller/interview.controller');
const { ensureAuthenticated } = require('../middlewares/auth.middleware');

const interviewrouter = express.Router();

interviewrouter.post('/start', ensureAuthenticated, startInterview);
interviewrouter.post('/end', ensureAuthenticated, handleAnswer);

module.exports = interviewrouter;
