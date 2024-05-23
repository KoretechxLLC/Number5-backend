const express = require("express");
const { verifyAccessToken } = require("../../../helper/jwt_helper");
const { verifyAdminRole } = require("../../../helper/check_role");
const UserController = require("../../Controllers/user.controller");
const uploadProfileImage = require("../../../utils/upload.profileImage");

const router = express.Router();

router.get("/get-user-data/:id", verifyAccessToken, UserController.get);


router.put("/edit-user-data/", verifyAccessToken,uploadProfileImage.single('profileImage'),UserController.put);

module.exports = router;
