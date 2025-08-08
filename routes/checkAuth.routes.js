const express = require('express');

const checkAuthrouter = express.Router();

checkAuthrouter.get('/check-auth', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

module.exports = checkAuthrouter;
