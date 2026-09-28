const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

//Register a new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    //Hash OTP
    const hashedOtp=await bcrypt.hash(otp,10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp:hashedOtp,
      otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
      isVerified: false,
    });

    // Email message
    const message = `Hello ${name},Welcome to ShopNest! Your OTP for email verification is: ${otp} This OTP is valid for 10 minutes.
    Thank you,
    Team ShopNest`;

    // Send OTP email
    await sendEmail(email, "ShopNest - Email Verification OTP", message);

    // Success response
    res.status(201).json({
      success: true,
      message: "Registration successful. OTP has been sent to your email.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(400).json({
        message: "Please verify your email before logging in.",
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    // res.status(500).json({message:'Server error'});
    console.log(error);
  }
};

//to verify otp
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

   if (user.otpExpires < Date.now()) {
    return res.status(400).json({
        message: "OTP Expired"
    });
}

const isOtpCorrect = await bcrypt.compare(otp, user.otp);

if (!isOtpCorrect) {
    return res.status(400).json({
        message: "Invalid OTP"
    });
}

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        message: "OTP Expired",
      });
    }

    user.isVerified = true;

    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    res.json({
      message: "OTP Verified Successfully",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUsers,
  verifyOtp,
};
