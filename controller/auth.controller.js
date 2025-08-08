const User = require('../models/user.model.js');
const passport = require('passport');

const signup = async (req, res) => {
  const { firstName, lastName, email, password, username } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'Email already registered' });

    const newUser = new User({ firstName, lastName, email, password, username });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.log("err:" + err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
};

const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(200).json({
        message: 'Login successful',
        user: { id: user._id, email: user.email }
      });
    });
  })(req, res, next);
};

const logout = (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.status(200).json({ message: 'Logout successful' });
  });
};

module.exports = {
  signup,
  login,
  logout
};
