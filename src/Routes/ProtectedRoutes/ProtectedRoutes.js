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
const ShopController = require("../../Controllers/shop.controller");
const uploadShopImage = require("../../../utils/upload.shopImage");
const notificationController = require("../../Controllers/notificationController");

const router = express.Router();

router.get("/get-user-data", verifyAccessToken, UserController.get);
router.put(
  "/edit-user-data",
  verifyAccessToken,
  uploadProfileImage.single("profileImage"),
  UserController.put
);
router.post("/send-message", verifyAccessToken, HelpController.sendMessage);
router.post(
  "/reply-message",
  verifyAccessToken,
  verifyAdminRole,
  HelpController.reply_message
);
router.get(
  "/get-messages/:page/:size",
  verifyAccessToken,
  verifyAdminRole,
  HelpController.get_message
);
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
router.get(
  "/get-users/:page/:size",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_users
);
router.get(
  "/get-all-users-count",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_all_user_count
);
router.get(
  "/get-active-users-count",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_active_user_count
);

router.get(
  "/get-inactive-users-count",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_inactive_user_count
);

router.get(
  "/get-pending-users-count",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_pending_user_count
);

router.get(
  "/get-pending-users/:page/:size",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_pending_user
);

router.get(
  "/get-approved-users/:page/:size",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_approved_user
);

router.post(
  "/send-notification",
  verifyAccessToken,
  verifyAdminRole,
  notificationController.send
);

router.get(
  "/get-inactive-users/:page/:size",
  verifyAccessToken,
  verifyAdminRole,
  UserController.get_inactive_user
);

router.put(
  "/change-status",
  verifyAccessToken,
  verifyAdminRole,
  UserController?.change_status
);

router.put(
  "/reject-user",
  verifyAccessToken,
  verifyAdminRole,
  UserController?.reject_user
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

const uploadFields = uploadEventImage.fields([
  { name: "eventImage", maxCount: 1 },
  { name: "todayspecial", maxCount: 10 }, // Adjust the maxCount as needed
]);

router.post(
  "/create-event",
  verifyAccessToken,
  verifyAdminRole,
  uploadFields,
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
  "/get-events-count",
  verifyAccessToken,
  EventController.getEventsCounts
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
  uploadFields,
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
  EventBookingController.getEventBooking
);

router.get(
  "/get-event-history/:id",
  verifyAccessToken,
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

router.put(
  "/save-device-token",
  verifyAccessToken,
  UserController.save_notification_token
);

router.delete(
  "/delete-user/:id",
  verifyAccessToken,
  UserController.delete_user_account
);

router.post(
  "/change-notification-option",
  verifyAccessToken,
  UserController.push_notification_option
);

router.post(
  "/add-shop-item",
  verifyAccessToken,
  verifyAdminRole,
  uploadShopImage.single("itemImage"),
  ShopController.add_item
);

router.put(
  "/update-shop-item",
  verifyAccessToken,
  verifyAdminRole,
  uploadShopImage.single("itemImage"),
  ShopController.update_item
);

router.get("/get-shop-item", verifyAccessToken, ShopController.get_item);
router.put(
  "/update-shop-item",
  verifyAccessToken,
  verifyAdminRole,
  uploadShopImage.single("itemImage"),
  ShopController.update_item
);

router.put(
  "/change-admin-password",
  verifyAccessToken,
  UserController.changeAdminPassword
);

module.exports = router;
