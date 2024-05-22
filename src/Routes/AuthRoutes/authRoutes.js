const express = require("express")
const AuthController = require("../../Controllers/auth.controller")
const uploadProfileImage = require("../../../utils/upload.profileImage")



const authRoutes = express.Router()


authRoutes.post("/register",uploadProfileImage.single('profileImage'),AuthController.registerUser)

authRoutes.put("/approved-user",AuthController.approvedUser)

authRoutes.post("/login",AuthController.login)

authRoutes.put("/block-user",AuthController.blockedUser)





module.exports  = authRoutes