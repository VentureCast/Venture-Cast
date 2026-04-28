#!/usr/bin/env node
/**
 * Create a user directly in MongoDB (bypasses /auth/signup Joi validation).
 * Use when you want a specific weak password for local dev or testing.
 *
 * Usage (from VentureCast_Backend-main):
 *   npm install   # once — needs mongoose, bcryptjs from backend deps
 *   node scripts/seed-local-user.js
 *   node scripts/seed-local-user.js "you@email.com" "Display Name" "password"
 *
 * Loads ../.env without requiring the `dotenv` package (parses KEY=value lines only).
 * Falls back to mongodb://localhost:27017/venture-cast-backend if MONGODB_URI is unset.
 */

const fs = require('fs');
const path = require('path');

(function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
})();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DEFAULT_EMAIL = 'colbybrundin@gmail.com';
const DEFAULT_NAME = 'VortexPhan';
const DEFAULT_PASSWORD = 'qwerty';

async function main() {
  const email = (process.argv[2] || DEFAULT_EMAIL).trim().toLowerCase();
  const name = process.argv[3] || DEFAULT_NAME;
  const password = process.argv[4] || DEFAULT_PASSWORD;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/venture-cast-backend';
  await mongoose.connect(uri);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists for ${email} (_id: ${existing._id}). Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  console.log(`Created user: ${email} (_id: ${user._id})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
