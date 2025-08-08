const express = require('express');
const currauthRouter = express.Router();

currauthRouter.get('/current-user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        profileImage: req.user.profileImage || null
      }
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

module.exports = currauthRouter;
