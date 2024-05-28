const express = require("express");
const { verifyAccessToken } = require("../../../helper/jwt_helper");
const { verifyAdminRole } = require("../../../helper/check_role");
const UserController = require("../../Controllers/user.controller");
const uploadProfileImage = require("../../../utils/upload.profileImage");
const HelpController = require("../../Controllers/help.controller");
const TermsAndConditionsController = require("../../Controllers/terms_and_condition.controller");
const uploadRegistrationImage = require("../../../utils/upload.registrationImage");
const RegistrationTypeController = require("../../Controllers/registrationtype.controller");
const uploadEventImage = require("../../../utils/upload.eventImage");
const EventController = require("../../Controllers/event.controller");

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

router.post(
  "/create-registration-type",
  verifyAccessToken,
  verifyAdminRole,
  uploadRegistrationImage.single("registrationImage"),
  RegistrationTypeController.createType
);

router.get(
  "/get-registration-type",
  verifyAccessToken,
  verifyAdminRole,
  RegistrationTypeController.get
);

router.put(
  "/update-registration-type",
  verifyAccessToken,
  verifyAdminRole,
  uploadRegistrationImage.single("registrationImage"),
  RegistrationTypeController.updateRegistrationType
);

router.delete(
  "/delete-registration-type/:id",
  verifyAccessToken,
  verifyAdminRole,
  RegistrationTypeController.deleteRegistrationType
);

router.post(
  "/create-event",
  verifyAccessToken,
  verifyAdminRole,
  uploadEventImage.single("eventImage"),
  EventController.createEvent
);

router.delete(
  "/delete-event/:id",
  verifyAccessToken,
  verifyAdminRole,
  EventController.delete
);

router.get(
  "/get-upcoming-events",
  verifyAccessToken,
  verifyAdminRole,
  EventController.getUpcomingEvents
);

router.get(
  "/get-events/:page/:size",
  verifyAccessToken,
  verifyAdminRole,
  EventController.getEvents
);

router.put(
  "/update-event",
  verifyAccessToken,
  verifyAdminRole,
  uploadEventImage.single("eventImage"),
  EventController.updateEvent
);

module.exports = router;
