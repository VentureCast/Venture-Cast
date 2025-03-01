

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
import { supabase } from '../supabaseClient';



const router = express.Router();

require('dotenv').config();

// Secret key for JWT
const JWT_SECRET = 'your_jwt_secret_key';

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  console.log(req.body)
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  console.log(existingUser,"haiga aa")
  if (existingUser) {
    return res.status(200).json({ message: 'User already exists' });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  // Create a new user
  const user = new User({
    name,
    email,
    password: hashedPassword,
  });

  try {
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
    console.log("user created")
  } catch (error) {
    res.status(500).json({ message: 'Error creating user' });
  }
});


router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)
  // Check if user exists
  const user = await User.findOne({ email });
  console.log(user,"user")
  if (!user) {
    return res.status(200).json({ message: 'Invalid credentials' });
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(isMatch)
  if (!isMatch) {
    return res.status(200).json({ message: 'Invalid credentials' });
  }
   
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

  res.json({ token, userId: user._id });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
      console.log(profile)
      // Check if user exists in the database
      let user = await User.findOne({ email: profile.emails[0].value });
      console.log(user,"user")
      
      if (!user) {
        // If not, create a new user
        user = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
        });
          await user.save();
        } 
        return done(null, user);
      }
        catch (error) {
          return done(error, null);
        }
      }
      
  )
);

passport.serializeUser((user, done) => {
  console.log("ethe aaya")
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  console.log("deserialize",id)
  const user = await User.findById(id);
  done(null, user);
});

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  (req, res) => {
   console.log("reached here")
    const token = jwt.sign({ id: req.user._id }, JWT_SECRET, { expiresIn: '1h' });
    console.log(token)
    res.redirect(`http://localhost:3000/home?token=${token}`);
  }
);

module.exports = router;
