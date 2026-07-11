const express = require('express');
const router= express.Router();

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const jwt = require('jsonwebtoken');


router.post('/login', async(req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    if (!user) return res.status(404).json({ error: 'Not found.' });
    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ userId:user.id, email:user.email}, process.env.JWT_SECRET, { expiresIn: '7d'});
    res.json({ token });
  } catch (dbErr) {
    console.error('❌ Login failed:', dbErr.message);
    return res.status(500).json({ error: 'Could not log in.' });
  }
});
router.post('/register', async (req, res) => {
  // Handle registration logic
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

const newPass = bcrypt.hashSync(password,10);
  // Save to DB after streaming is done
    try {
      await prisma.user.create({
        data: { email, password: newPass }
      });
      console.log('✅ User saved to DB');
    } catch (dbErr) {
      console.error('❌ DB save failed:', dbErr.message);
    }

  // Create user
  res.json({message: "User registered successfully"});
});

module.exports = router;