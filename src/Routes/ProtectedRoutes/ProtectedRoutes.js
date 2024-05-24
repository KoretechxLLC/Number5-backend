const express = require("express");
const { verifyAccessToken } = require("../../../helper/jwt_helper");
const { verifyAdminRole } = require("../../../helper/check_role");
const UserController = require("../../Controllers/user.controller");
const uploadProfileImage = require("../../../utils/upload.profileImage");
const HelpController = require("../../Controllers/help.controller");
const TermsAndConditionsController = require("../../Controllers/terms_and_condition.controller");

const router = express.Router();

router.get("/get-user-data/:id", verifyAccessToken, UserController.get);
router.put(
  "/edit-user-data/",
  verifyAccessToken,
  uploadProfileImage.single("profileImage"),
  UserController.put
);
router.post("/send-message", verifyAccessToken, HelpController.sendMessage);
router.post(
  "/add-terms-and-conditions",
  verifyAccessToken,
  verifyAdminRole,
  TermsAndConditionsController.addTermsAndConditions
);

module.exports = router;
