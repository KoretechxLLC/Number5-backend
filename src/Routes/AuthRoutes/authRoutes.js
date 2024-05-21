const express = require("express")
const AuthController = require("../../Controllers/auth.controller")
const uploadProfileImage = require("../../../utils/upload.profileImage")



const authRoutes = express.Router()


authRoutes.post("/register",uploadProfileImage.single('profileImage'),AuthController.registerUser)



module.exports  = authRoutes