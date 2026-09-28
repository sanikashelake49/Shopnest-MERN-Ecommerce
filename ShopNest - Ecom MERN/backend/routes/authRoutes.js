const express=require("express");
const router=express.Router();
const{registerUser,loginUser,getUsers, verifyOtp}=require("../controllers/authController");

const {protect}=require('../middleware/authMiddleware');
const{ admin}=require('../middleware/adminMiddleware');

router.post("/register",registerUser);
router.post("/login",loginUser);
router.get("/users",protect,admin,getUsers);
router.post("/verify-otp",verifyOtp);

module.exports=router;