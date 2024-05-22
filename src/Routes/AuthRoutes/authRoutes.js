const express = require("express")
const AuthController = require("../../Controllers/auth.controller")
const uploadProfileImage = require("../../../utils/upload.profileImage")



const authRoutes = express.Router()


authRoutes.post("/register",uploadProfileImage.single('profileImage'),AuthController.registerUser)


authRoutes.post("/login",AuthController.login)

authRoutes.post("/approved-user",AuthController.approvedUser)





module.exports  = authRoutes