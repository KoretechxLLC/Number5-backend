const createError = require("http-errors");
const UserModel = require("../Models/user.model");
const {
  authSchema,
  updateUserSchema,
} = require("../../helper/validation_schema");
const path = require("path");
const fs = require("fs");
const MembershipModel = require("../Models/membership.model");
const { sendEmail } = require("../../helper/send_email");
const bcrypt = require("bcrypt");

const UserController = {
  get: async (req, res, next) => {
    try {
      const payload = req.payload;
      const id = payload.aud;

      if (!id) {
        throw createError.BadRequest();
      }

      let user = await UserModel.findById(id);

      if (!user || user?.length == 0) {
        throw createError.NotFound("User Not Found");
      }

      let dataToSend = {
        registration_type: user?.registration_type,
        couples_type: user?.couples_type,
        registration_fee: user?.registration_fee,
        gender: user?.gender,
        first_name: user?.first_name,
        last_name: user?.last_name,
        date_of_birth: user?.date_of_birth,
        email: user?.email,
        phone_number: user?.phone_number,
        address: user?.address,
        occupation: user?.occupation,
        height: user?.height,
        weight: user?.weight,
        id: user?.id,
        sexuality: user?.sexuality,
        life_style: user?.life_style,
        membership: user?.membership,
        card_number: user?.card_number,
        wanted_experience: user?.wanted_experience,
        user_quality: user?.user_quality,
        user_status: user?.user_status,
        is_fee_paid: user?.is_fee_paid,
        membership_id: user?.membership_id,
        username: user?.username,
        profile_pic: user?.profile_pic,
        token: user?.token,
        event_visits: user?.event_visits,
        push_notification_option: user?.push_notification_option,
        is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
        role: user?.role,
      };

      res.status(200).json({
        message: "User data successfully retrived",
        data: dataToSend,
      });
    } catch (err) {
      next(err);
    }
  },
  get_users: async (req, res, next) => {
    try {
      let page = parseInt(req.params.page);
      let size = parseInt(req.params.size);

      let query = {};

      let users;

      if (!page || !size || page <= 0 || size <= 0) {
        // Retrieve all data
        users = await UserModel.find(query);
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query).skip(skip).limit(limit);
      }

      if (!users || users.length == 0)
        throw createError.NotFound("Users Not Found");

      users =
        users &&
        users.length > 0 &&
        users.map((user, i) => {
          return {
            registration_type: user?.registration_type,
            couples_type: user?.couples_type,
            registration_fee: user?.registration_fee,
            gender: user?.gender,
            first_name: user?.first_name,
            last_name: user?.last_name,
            date_of_birth: user?.date_of_birth,
            email: user?.email,
            phone_number: user?.phone_number,
            address: user?.address,
            occupation: user?.occupation,
            height: user?.height,
            weight: user?.weight,
            id: user?.id,
            sexuality: user?.sexuality,
            life_style: user?.life_style,
            membership: user?.membership,
            card_number: user?.card_number,
            wanted_experience: user?.wanted_experience,
            user_quality: user?.user_quality,
            user_status: user?.user_status,
            is_fee_paid: user?.is_fee_paid,
            membership_id: user?.membership_id,
            username: user?.username,
            profile_pic: user?.profile_pic,
            token: user?.token,
            event_visits: user?.event_visits,
            push_notification_option: user?.push_notification_option,
            is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
            role: user?.role,
          };
        });

      console.log(users, "users");

      res.status(200).json({
        message: "Users Retrieved Successfully",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },
  put: async (req, res, next) => {
    let filename = req?.file?.filename;

    try {
      const userData = req.body;

      const { id } = userData;

      if (filename) {
        userData.profile_pic = filename;
      }
      if (!id) {
        throw createError.BadRequest("Required fields are missing");
      }

      const user = await UserModel.findById(id);

      if (!user) {
        throw createError.NotFound("User Not Found");
      }

      let phoneNumber = userData.phone_number;
      let userId = user._id;

      let isPhoneNumberExists = await UserModel.find({
        phone_number: phoneNumber,
        _id: { $ne: userId },
      });

      if (isPhoneNumberExists && isPhoneNumberExists?.length > 0)
        throw createError.BadRequest("Phone Number already exists");

      if (!filename) {
        userData.profile_pic = user?.profile_pic;
      }

      let result = await updateUserSchema.validateAsync(userData);

      let oldProfilePicFilename = user.profile_pic;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/profileImages/${oldProfilePicFilename}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      const updatedUser = await UserModel.findByIdAndUpdate(id, result, {
        new: true,
      });

      if (!updatedUser) {
        throw createError.NotFound("User Not Found");
      }

      let dataToSend = { ...updatedUser._doc };
      delete dataToSend.password;

      dataToSend.id = dataToSend?._id;

      delete dataToSend._id;

      res.status(200).json({
        message: "User updated successfully",
        data: dataToSend,
      });
    } catch (err) {
      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/profileImages/${filename}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (err.isJoi) return next(createError.BadRequest());

      next(err);
    }
  },
  upgrade_membership: async (req, res, next) => {
    try {
      let { membership, id, amount } = req.body;

      if (!membership || Object.keys(membership).length == 0 || !id) {
        throw createError.BadRequest("Required fields are missing");
      }

      let userData = await UserModel.findById(id);

      if (!userData) throw createError.NotFound("User Not Found");

      let membershipData = await MembershipModel.findById(membership?._id);

      if (!membershipData) throw createError.NotFound("Membership Not Found");

      membershipData.consumedPasses = 0;
      membershipData.guestAttended = 0;
      membershipData.remainingVisits = membershipData?.total_passes;
      membershipData.purchase_date = new Date();

      let expiryDate = new Date(membershipData.purchase_date);
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      membershipData.expiry_date = expiryDate;

      let updatedUserData = await UserModel.findByIdAndUpdate(
        id,
        { $set: { membership: membershipData } },
        { new: true }
      );

      let dataToSend = { ...updatedUserData._doc };

      dataToSend.id = updatedUserData?._id;

      res.status(200).json({
        message: "User Data Successfully Updated",
        data: dataToSend,
      });
    } catch (err) {
      next(err);
    }
  },
  save_notification_token: async (req, res, next) => {
    try {
      let { token, userId } = req.body;

      if (!token || !userId)
        throw createError.BadRequest("Required fields are missing");

      let user = await UserModel.findById(userId);

      if (!user) throw createError.NotFound("User Not Found");

      user.token = token;

      await user.save();

      res.status(200).json({
        message: "Device Token Successfully Updated",
      });
    } catch (err) {
      next(err);
    }
  },
  delete_user_account: async (req, res, next) => {
    try {
      let { id } = req.params;

      let user = await UserModel.findByIdAndDelete(id);

      if (!user) throw createError.NotFound("User Not Found");

      res.status(200).json({
        message: "User Account Successfully Deleted",
      });
    } catch (err) {
      next(err);
    }
  },
  push_notification_option: async (req, res, next) => {
    try {
      let { pushNotificationOption, id } = req.body;

      let user = await UserModel.findOne({ _id: id });
      if (!user) throw createError.BadRequest("No User Found");

      user.push_notification_option = pushNotificationOption;

      await user.save();

      res.status(200).json({
        message: "Push Notification Option Successfully Updated",
      });
    } catch (err) {
      next(err);
    }
  },
  get_all_user_count: async (req, res, next) => {
    try {
      let userCount = await UserModel.countDocuments({});

      res.status(200).json({
        message: "Users count successfully retreived",
        data: userCount,
      });
    } catch (err) {
      next(err);
    }
  },
  get_active_user_count: async (req, res, next) => {
    try {
      let activeUserCount = await UserModel.countDocuments({
        user_status: "approved",
      });

      res.status(200).json({
        message: "Active users count successfully retrieved",
        data: activeUserCount,
      });
    } catch (err) {
      next(err);
    }
  },
  get_inactive_user_count: async (req, res, next) => {
    try {
      let activeUserCount = await UserModel.countDocuments({
        user_status: "inactive",
      });

      res.status(200).json({
        message: "Inactive users count successfully retrieved",
        data: activeUserCount,
      });
    } catch (err) {
      next(err);
    }
  },
  get_pending_user_count: async (req, res, next) => {
    try {
      let activeUserCount = await UserModel.countDocuments({
        user_status: "pending",
      });

      res.status(200).json({
        message: "Inactive users count successfully retrieved",
        data: activeUserCount,
      });
    } catch (err) {
      next(err);
    }
  },
  get_pending_user: async (req, res, next) => {
    try {
      let page = parseInt(req.params.page);
      let size = parseInt(req.params.size);

      let query = { user_status: "pending" }; // Add condition for pending status

      let users;

      if (!page || !size || page <= 0 || size <= 0) {
        // Retrieve all data
        users = await UserModel.find(query);
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query).skip(skip).limit(limit);
      }

      if (!users || users.length == 0)
        throw createError.NotFound("Users Not Found");

      users =
        users &&
        users.length > 0 &&
        users.map((user, i) => {
          return {
            registration_type: user?.registration_type,
            couples_type: user?.couples_type,
            registration_fee: user?.registration_fee,
            gender: user?.gender,
            first_name: user?.first_name,
            last_name: user?.last_name,
            date_of_birth: user?.date_of_birth,
            email: user?.email,
            phone_number: user?.phone_number,
            address: user?.address,
            occupation: user?.occupation,
            height: user?.height,
            weight: user?.weight,
            id: user?.id,
            sexuality: user?.sexuality,
            life_style: user?.life_style,
            membership: user?.membership,
            card_number: user?.card_number,
            wanted_experience: user?.wanted_experience,
            user_quality: user?.user_quality,
            user_status: user?.user_status,
            is_fee_paid: user?.is_fee_paid,
            membership_id: user?.membership_id,
            username: user?.username,
            profile_pic: user?.profile_pic,
            token: user?.token,
            event_visits: user?.event_visits,
            push_notification_option: user?.push_notification_option,
            is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
            role: user?.role,
          };
        });

      res.status(200).json({
        message: "Users Retrieved Successfully",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },
  get_approved_user: async (req, res, next) => {
    try {
      let page = parseInt(req.params.page);
      let size = parseInt(req.params.size);

      let query = { user_status: "approved" };

      let users;

      if (!page || !size || page <= 0 || size <= 0) {
        // Retrieve all data
        users = await UserModel.find(query);
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query).skip(skip).limit(limit);
      }

      if (!users || users.length == 0)
        throw createError.NotFound("Users Not Found");

      users =
        users &&
        users.length > 0 &&
        users.map((user, i) => {
          return {
            registration_type: user?.registration_type,
            couples_type: user?.couples_type,
            registration_fee: user?.registration_fee,
            gender: user?.gender,
            first_name: user?.first_name,
            last_name: user?.last_name,
            date_of_birth: user?.date_of_birth,
            email: user?.email,
            phone_number: user?.phone_number,
            address: user?.address,
            occupation: user?.occupation,
            height: user?.height,
            weight: user?.weight,
            id: user?.id,
            sexuality: user?.sexuality,
            life_style: user?.life_style,
            membership: user?.membership,
            card_number: user?.card_number,
            wanted_experience: user?.wanted_experience,
            user_quality: user?.user_quality,
            user_status: user?.user_status,
            is_fee_paid: user?.is_fee_paid,
            membership_id: user?.membership_id,
            username: user?.username,
            profile_pic: user?.profile_pic,
            token: user?.token,
            event_visits: user?.event_visits,
            push_notification_option: user?.push_notification_option,
            is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
            role: user?.role,
          };
        });

      res.status(200).json({
        message: "Users Retrieved Successfully",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },
  get_inactive_user: async (req, res, next) => {
    try {
      let page = parseInt(req.params.page);
      let size = parseInt(req.params.size);

      let query = { user_status: "inactive" };

      let users;

      if (!page || !size || page <= 0 || size <= 0) {
        // Retrieve all data
        users = await UserModel.find(query);
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query).skip(skip).limit(limit);
      }

      if (!users || users.length == 0)
        throw createError.NotFound("Users Not Found");

      users =
        users &&
        users.length > 0 &&
        users.map((user, i) => {
          return {
            registration_type: user?.registration_type,
            couples_type: user?.couples_type,
            registration_fee: user?.registration_fee,
            gender: user?.gender,
            first_name: user?.first_name,
            last_name: user?.last_name,
            date_of_birth: user?.date_of_birth,
            email: user?.email,
            phone_number: user?.phone_number,
            address: user?.address,
            occupation: user?.occupation,
            height: user?.height,
            weight: user?.weight,
            id: user?.id,
            sexuality: user?.sexuality,
            life_style: user?.life_style,
            membership: user?.membership,
            card_number: user?.card_number,
            wanted_experience: user?.wanted_experience,
            user_quality: user?.user_quality,
            user_status: user?.user_status,
            is_fee_paid: user?.is_fee_paid,
            membership_id: user?.membership_id,
            username: user?.username,
            profile_pic: user?.profile_pic,
            token: user?.token,
            event_visits: user?.event_visits,
            push_notification_option: user?.push_notification_option,
            is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
            role: user?.role,
          };
        });

      res.status(200).json({
        message: "Users Retrieved Successfully",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },
  change_status: async (req, res, next) => {
    try {
      let { email, status } = req.body;

      if (!email || !status)
        throw createError.BadRequest("Required fields are missing");

      let user = await UserModel.findOneAndUpdate(
        { email: email },
        {
          user_status:
            status?.toLowerCase() == "active" ? "inactive" : "approved",
        },
        { new: true }
      );

      if (!user) {
        throw createError.NotFound("User not found");
      }

      res.status(200).json({
        message: `User has been ${
          status?.toLowerCase() == "active" ? "inactived" : "approved"
        } successfully`,
      });
    } catch (err) {
      next(err);
    }
  },
  reject_user: async (req, res, next) => {
    try {
      let { email } = req.body;

      if (!email) throw createError.BadRequest("Required fields are missing");

      let rejectUser = await UserModel.findOneAndUpdate(
        { email: email },
        { $set: { user_status: "rejected" } },
        { new: true }
      );

      if (!rejectUser) throw createError.BadRequest("No User Found");

      let subject = "Number 5 Club Registration Response";
      let message =
        "We regret to inform you that your profile has been rejected. For further details, please contact our support team.";

      await sendEmail(email, subject, message);

      res.status(200).json({
        message: "User profile has been successfully rejected",
        data: rejectUser,
      });
    } catch (err) {
      next(err);
    }
  },
  changeAdminPassword: async (req, res, next) => {
    try {
      let { currentPassword, newPassword, confirmPassword, id } = req.body;

      if (!currentPassword || newPassword || !confirmPassword)
        throw createError.BadRequest("Required fields are missing");

      if (newPassword !== confirmPassword)
        throw createError.BadRequest("Confirm Password is not matching");

      let user = await UserModel.findById(id);

      if (!user) throw createError.BadRequest("User not found");

      if (user.role?.toLowerCase() !== "admin")
        throw createError.Unauthorized("Unauthorized");

      let checkPassword = await user.isValidPassword(result?.password);

      if (!checkPassword)
        throw createError.BadRequest("Invalid Current Password");

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashPassword;

      await user.save();

      res.status(200).json({
        message: "Password updated successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
