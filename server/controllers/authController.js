import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js';
import transporter from '../config/nodemailer.js';
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from '../config/emailTemplates.js'

// Shared cookie options
const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,                  // required for cross-site cookies in prod
    sameSite: isProd ? "None" : "Lax", // None for cross-site, Lax is fine for localhost
    maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
  };
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.json({ success: false, message: 'Missing Details' })
  }
  try {
    const existingUser = await userModel.findOne({ email })
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new userModel({ name, email, password: hashedPassword })
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie("token", token, getCookieOptions());

    // Send welcome email
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Welcome to Site",
      text: `Welcome to site. Your account has been created with email id: ${email}`
    }
    await transporter.sendMail(mailOptions);

    return res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({ success: false, message: 'Email and password are required' })
  }
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: 'Invalid email' })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid password' })
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie("token", token, getCookieOptions());

    return res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      ...getCookieOptions(),
      maxAge: 0 // immediately expire
    });
    return res.json({ success: true, message: "Logged Out" })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Send Verification OTP
export const sendVerifyOtp = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await userModel.findById(userId);
    if (user.isAccountVerified) {
      return res.json({ success: false, message: "Account Already verified" })
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Account Verification OTP",
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    }
    await transporter.sendMail(mailOption)

    return res.json({ success: true, message: 'Verification OTP Sent on Email' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// Verify email
export const verifyEmail = async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.json({ success: false, message: "Missing Details" })
  }
  try {
    const user = await userModel.findById(userId)
    if (user.verifyOtp === '' || user.verifyOtp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' })
    }
    if (user.verifyOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: 'OTP Expired' })
    }
    user.isAccountVerified = true;
    user.verifyOtp = '';
    user.verifyOtpExpireAt = 0;
    await user.save();
    return res.json({ success: true, message: 'Email verified successfully' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// Check authentication
export const isAuthenticatd = async (req, res) => {
  try {
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// Send reset OTP
export const sendResetOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.json({ success: false, message: 'Email is required' })
  }
  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    user.resetOtp = otp;
    user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: "Password Reset OTP",
      html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
    };
    await transporter.sendMail(mailOption);

    return res.json({ success: true, message: 'OTP sent to your Email' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}

// Reset password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.json({ success: false, message: 'Email, OTP, and new password are required' })
  }
  try {
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.json({ success: false, message: 'User not found' })
    }
    if (user.resetOtp === "" || user.resetOtp !== otp) {
      return res.json({ success: false, message: 'Invalid OTP' })
    }
    if (user.resetOtpExpireAt < Date.now()) {
      return res.json({ success: false, message: "OTP Expired" })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireAt = 0;
    await user.save();
    return res.json({ success: true, message: 'Password has been reset successfully' })
  } catch (error) {
    return res.json({ success: false, message: error.message })
  }
}
