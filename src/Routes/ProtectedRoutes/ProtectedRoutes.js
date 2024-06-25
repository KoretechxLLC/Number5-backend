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
const MembershipController = require("../../Controllers/membership.controller");
const uploadBadgeImage = require("../../../utils/upload.badgeImage");
const uploadGuestIdcardImage = require("../../../utils/upload.guestIdcardImage");
const EventBooking = require("../../Controllers/eventbooking.controller");
const EventBookingController = require("../../Controllers/eventbooking.controller");

const router = express.Router();

router.get("/get-user-data", verifyAccessToken, UserController.get);

router.put(
  "/edit-user-data",
  // verifyAccessToken,
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

router.get("/get-registration-type", RegistrationTypeController.get);

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
  EventController.getUpcomingEvents
);

router.get(
  "/get-events/:page/:size",
  verifyAccessToken,
  EventController.getEvents
);

router.get(
  "/get-today-event",
  verifyAccessToken,
  EventController.getTodayEvent
);

router.put(
  "/update-event",
  verifyAccessToken,
  verifyAdminRole,
  uploadEventImage.single("eventImage"),
  EventController.updateEvent
);

router.post(
  "/add-membership",
  verifyAccessToken,
  verifyAdminRole,
  uploadBadgeImage.single("badgeImage"),
  MembershipController.add_membersip
);

router.get("/get-membership", verifyAccessToken, MembershipController.get);

router.put(
  "/update-membership",
  verifyAccessToken,
  verifyAdminRole,
  uploadBadgeImage.single("badgeImage"),
  MembershipController.update_membersip
);

router.post(
  "/upgrade-membership",
  verifyAccessToken,
  UserController.upgrade_membership
);

router.post(
  "/event-booking",
  verifyAccessToken,
  uploadGuestIdcardImage.array("idCard"),
  EventBookingController.post
);

router.get(
  "/get-bookings/:id",
  verifyAccessToken,
  EventBookingController.getInprocessBookings
);

router.get(
  "/get-event-bookings/:eventId",
  verifyAccessToken,
  verifyAdminRole,
  EventBookingController.getEventBooking
);

router.get(
  "/get-event-history/:id",
  verifyAccessToken,
  verifyAdminRole,
  EventBookingController.getUserEventsHistory
);

router.put(
  "/change-arrival-time",
  verifyAccessToken,
  EventBookingController.changeArrivalTime
);


router.put(
  "/cancel-booking/:id",
  verifyAccessToken,
  EventBookingController.cancelBooking
);


router.put(
  "/attend-event",
  verifyAccessToken,
  EventBookingController.consumeBooking
);


module.exports = router;
