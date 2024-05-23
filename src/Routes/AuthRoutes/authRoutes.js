const express = require("express")
const AuthController = require("../../Controllers/auth.controller")
const uploadProfileImage = require("../../../utils/upload.profileImage")
const { verifyAccessToken } = require("../../../helper/jwt_helper")
const { verifyAdminRole } = require("../../../helper/check_role")



const authRoutes = express.Router()


authRoutes.post("/register",uploadProfileImage.single('profileImage'),AuthController.registerUser)

authRoutes.post("/login",AuthController.login)

authRoutes.post("/refresh-token",AuthController.refreshToken)

authRoutes.put("/approved-user",verifyAccessToken,verifyAdminRole,AuthController.approvedUser)

authRoutes.put("/block-user",verifyAccessToken,verifyAdminRole,AuthController.blockedUser)

authRoutes.post("/forgot-password",AuthController.forgotPassword)

authRoutes.post("/change-password",AuthController.changePassword)



module.exports  = authRoutes