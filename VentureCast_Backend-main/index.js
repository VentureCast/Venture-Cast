const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const Streamer = require('./routes/Streamers')
const passport = require('passport');
const session = require('express-session');
const connectDB = require('./config/db');
const stripeRoutes = require('./routes/stripe');

require('dotenv').config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());


app.get('/', (req, res) => {
  res.send('Venture Cast Backend Running');
});

app.use('/auth', authRoutes);
app.use('/streamer', Streamer)
app.use('/stripe', stripeRoutes);

// Listen on port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
