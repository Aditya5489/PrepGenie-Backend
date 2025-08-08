const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/db');
const session = require('express-session');
const passport = require('passport');
const initializePassport = require('./config/passport');
const MongoStore = require('connect-mongo');

const authRouter = require('./routes/auth.routes');
const interviewrouter = require('./routes/interview.routes');
const checkAuthrouter = require('./routes/checkAuth.routes');
const resumeRoutes = require('./routes/resume.routes');
const historyRoutes = require('./routes/history.routes');
const currauthRouter = require('./routes/currauth.routes');
const profileRouter = require('./routes/profile.routes'); 

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    ttl: 60 * 60 * 24 * 7, 
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', 
    maxAge: 1000 * 60 * 60 * 24 * 7, 
  }
}));

app.use(passport.initialize());
app.use(passport.session());

initializePassport(passport);

// Routes
app.use('/api', authRouter);
app.use('/api', interviewrouter);
app.use('/api', checkAuthrouter);
app.use('/api/resume', resumeRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/auth', currauthRouter);
app.use('/api/auth', profileRouter); 
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(port, () => {
  connectDb();
  console.log(`Server is running on port ${port}`);
});
