import express from 'express';
import jwt from 'jsonwebtoken';
import Faculty from '../models/Faculty.js';

const router = express.Router();

// Mock OTP store: phone -> { otp, expires }
const otpStore = {};

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Admin Login (using Email & Password)
 * Default password for all admins is 'admin123'
 */
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body; // email field can accept email or username 'mohan'

  try {
    const searchVal = email.trim();
    const query = {
      $or: [
        { email: new RegExp('^' + searchVal + '$', 'i') },
        { staffId: new RegExp('^' + searchVal + '$', 'i') },
        { name: new RegExp('^' + searchVal + '$', 'i') }
      ],
      isActive: true
    };

    const faculty = await Faculty.findOne(query);
    
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found.' });
    }

    if (faculty.role !== 'Admin' && faculty.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }

    // New password check
    if (password !== 'mohan123') {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    const token = jwt.sign(
      { id: faculty._id, role: faculty.role, name: faculty.name },
      process.env.JWT_SECRET || 'super_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        phone: faculty.phone,
        role: faculty.role,
        isHOD: faculty.isHOD
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
});

/**
 * Staff Login - Step 1: Send OTP
 */
router.post('/staff/send-otp', async (req, res) => {
  const { phone } = req.body;

  try {
    const faculty = await Faculty.findOne({ phone, isActive: true });
    if (!faculty) {
      return res.status(404).json({ message: 'No active staff account found with this phone number.' });
    }

    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    otpStore[phone] = { otp, expires };

    console.log(`[SMS Gateway Mock] OTP for ${phone} is: ${otp}`);

    // Return the OTP in response for development convenience
    res.json({
      message: 'OTP sent successfully (Simulated)',
      otp, // In production this would be sent via SMS, not returned in response
      phone
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating OTP.', error: error.message });
  }
});

/**
 * Staff Login - Step 2: Verify OTP
 */
router.post('/staff/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const record = otpStore[phone];

    if (!record) {
      return res.status(400).json({ message: 'OTP request not found or expired.' });
    }

    if (Date.now() > record.expires) {
      delete otpStore[phone];
      return res.status(400).json({ message: 'OTP has expired.' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP entered.' });
    }

    // Success - Clear OTP
    delete otpStore[phone];

    const faculty = await Faculty.findOne({ phone });
    const token = jwt.sign(
      { id: faculty._id, role: faculty.role, name: faculty.name },
      process.env.JWT_SECRET || 'super_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        phone: faculty.phone,
        role: faculty.role,
        isHOD: faculty.isHOD
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP.', error: error.message });
  }
});

export default router;
