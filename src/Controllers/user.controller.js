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
const InpersonRegistrationModel = require("../Models/inperson.registration.model");
const MembershipHistoryModel = require("../Models/membership.history.model");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SK);

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
        ethnicity: user?.ethnicity,
        interest: user?.interest,
        hobbies: user?.hobbies,
        country: user?.country,
        is_invited_for_elite_membership: user?.is_invited_for_elite_membership,
        is_elgible_for_executive_membership:
          user?.is_elgible_for_executive_membership,
        is_elgible_for_elite_membership: user?.is_elgible_for_elite_membership,
        city: user?.city,
        postalCode: user?.postalCode,
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
        // Retrieve all data sorted in descending order
        users = await UserModel.find(query).sort({ created_at: -1 });
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 });
      }

      if (!users || users.length == 0)
        throw createError.NotFound("Users Not Found");

      users = users.map((user) => {
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
          ethnicity: user?.ethnicity,
          interest: user?.interest,
          hobbies: user?.hobbies,
          country: user?.country,
          city: user?.city,
          postalCode: user?.postalCode,
          is_invited_for_elite_membership:
            user?.is_invited_for_elite_membership,
          is_elgible_for_executive_membership:
            user?.is_elgible_for_executive_membership,
          is_elgible_for_elite_membership:
            user?.is_elgible_for_elite_membership,
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
      console.log(err, "err");
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
    let chargeId;

    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let { membership, id, amount, token } = req.body;

      if (!membership || Object.keys(membership).length === 0 || !id) {
        throw createError.BadRequest("Required fields are missing");
      }

      if (membership?.package_name?.toLowerCase() !== "pay as you go") {
        if (!amount || !token) {
          throw createError.BadRequest("Required fields are missing");
        }
      }

      let userData = await UserModel.findById(id).session(session);
      if (!userData) throw createError.NotFound("User Not Found");

      let membershipData = await MembershipModel.findById(
        membership?._id
      ).session(session);
      if (!membershipData) throw createError.NotFound("Membership Not Found");

      const lastMembership = await MembershipHistoryModel.findOne()
        .sort({ created_at: -1 })
        .session(session);

      if (membership?.package_name === "Executive Membership") {
        let allPremiumMembership = await MembershipHistoryModel.find({
          package_name: "Premium Membership",
          userId: id,
        }).session(session);

        if (!allPremiumMembership || allPremiumMembership.length === 0) {
          throw createError.BadRequest(
            "You are not eligible for executive membership"
          );
        }

        let allDays = allPremiumMembership.reduce((pre, curr) => {
          return (
            (Number(pre) || 0) + (Number(curr?.membership_duration_days) || 0)
          );
        }, 0);

        let lastMembershipDays = 0;

        if (lastMembership?.package_name === "Premium Membership") {
          const { purchase_date, expiry_date } = lastMembership;
          const purchaseDate = new Date(purchase_date);
          const expiryDate = new Date(expiry_date);
          const currentDate = new Date();

          const totalDurationDays = Math.ceil(
            (expiryDate - purchaseDate) / (1000 * 60 * 60 * 24)
          );
          const remainingDays = Math.ceil(
            (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
          );
          let totalDays = totalDurationDays - remainingDays;

          lastMembershipDays =
            currentDate >= expiryDate ? totalDurationDays : totalDays;
        }

        if (Number(allDays) + Number(lastMembershipDays) < 180) {
          throw createError.BadRequest(
            "You are not eligible for executive membership"
          );
        }
      } else if (membership?.package_name === "Elite Membership") {
        let allExecutiveMembership = await MembershipHistoryModel.find({
          package_name: "Executive Membership",
          userId: id,
        }).session(session);

        if (!allExecutiveMembership || allExecutiveMembership.length === 0) {
          throw createError.BadRequest(
            "You are not eligible for elite membership"
          );
        }

        let allDays = allExecutiveMembership.reduce((pre, curr) => {
          return (
            (Number(pre) || 0) + (Number(curr?.membership_duration_days) || 0)
          );
        }, 0);

        let lastMembershipDays = 0;

        if (lastMembership?.package_name === "Executive Membership") {
          const { purchase_date, expiry_date } = lastMembership;
          const purchaseDate = new Date(purchase_date);
          const expiryDate = new Date(expiry_date);
          const currentDate = new Date();

          const totalDurationDays = Math.ceil(
            (expiryDate - purchaseDate) / (1000 * 60 * 60 * 24)
          );
          const remainingDays = Math.ceil(
            (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
          );
          let totalDays = totalDurationDays - remainingDays;

          lastMembershipDays =
            currentDate >= expiryDate ? totalDurationDays : totalDays;
        }

        if (Number(allDays) + Number(lastMembershipDays) < 180) {
          throw createError.BadRequest(
            "You are not eligible for elite membership"
          );
        }
      }

      membershipData.consumedPasses = 0;
      membershipData.guestAttended = 0;
      membershipData.remainingVisits = membershipData?.total_passes;
      membershipData.purchase_date = new Date();

      let expiryDate = new Date(membershipData.purchase_date);
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      membershipData.expiry_date = expiryDate;

      let stripeData;

      if (membership?.package_name?.toLowerCase() !== "pay as you go") {
        try {
          stripeData = await stripe.paymentIntents.create({
            amount: Math.ceil(amount * 100), // Amount in cents
            currency: "ttd",
            payment_method: token,
            confirm: true,
            description: `Purchase ${membership?.package_name} in numberfive club`,
            receipt_email: userData.email,
            metadata: {
              membership_type: membership?.package_name,
              description: `Purchase ${membership?.package_name} in numberfive club`,
            },
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: "never",
            },
          });
        } catch (stripeError) {
          throw createError.InternalServerError(
            stripeError?.raw?.message || "Stripe charge failed"
          );
        }
      }

      chargeId = stripeData?.latest_charge;

      let charge;
      if (chargeId) {
        charge = await stripe.charges.retrieve(chargeId);
      }

      let updatedUserData = await UserModel.findByIdAndUpdate(
        id,
        { $set: { membership: membershipData } },
        { new: true, session }
      );

      let dataToSend = { ...updatedUserData._doc, id: updatedUserData?._id };

      if (lastMembership) {
        const { purchase_date, expiry_date } = lastMembership;
        const purchaseDate = new Date(purchase_date);
        const expiryDate = new Date(expiry_date);
        const currentDate = new Date();

        const totalDurationDays = Math.ceil(
          (expiryDate - purchaseDate) / (1000 * 60 * 60 * 24)
        );
        const remainingDays = Math.ceil(
          (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
        );
        let totalDays = totalDurationDays - remainingDays;

        lastMembership.membership_duration_days =
          currentDate >= expiryDate ? totalDurationDays : totalDays;
        await lastMembership.save({ session });
      }

      let dataToSendForHistory = {
        package_name: membershipData.package_name,
        userId: id,
        membership_id: membershipData?._id,
        duration_type: membershipData?.duration_type,
        male_membership_amount: membershipData?.male_membership_amount,
        female_membership_amount: membershipData?.female_membership_amount,
        couple_membership_amount: membershipData?.couple_membership_amount,
        purchase_date: membershipData?.purchase_date,
        transaction_id: stripeData?.id,
        amount: stripeData?.amount,
        payment_method: stripeData?.payment_method,
        receipt_url: charge?.receipt_url,
        charge_id: charge?.id,
        expiry_date: membershipData?.expiry_date,
        default_membership: membershipData?.default_membership,
      };

      let membershipHistory = await MembershipHistoryModel.create(
        [dataToSendForHistory],
        { session }
      );

      let email = userData?.email;
      let subject = "Payment receipt by number5 club";
      let body = `You have been charge to purchase ${membership?.package_name} Here is you invoice receipt url <a>${charge?.receipt_url}</a>`;

      await sendEmail(email, subject, body);

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Membership Successfully Updated",
        data: dataToSend,
        last_membership: lastMembership,
        current_membership: membershipHistory,
      });
    } catch (err) {
      await session.abortTransaction();

      if (chargeId) {
        try {
          await stripe.refunds.create({ charge: chargeId });
        } catch (refundError) {
          console.error("Failed to refund charge:", refundError);
        }
      }

      session.endSession();
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
        users = await UserModel.find(query).sort({ created_at: -1 });
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 });
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
            ethnicity: user?.ethnicity,
            interest: user?.interest,
            hobbies: user?.hobbies,
            country: user?.country,
            city: user?.city,
            postalCode: user?.postalCode,
            is_invited_for_elite_membership:
              user?.is_invited_for_elite_membership,
            is_elgible_for_executive_membership:
              user?.is_elgible_for_executive_membership,
            is_elgible_for_elite_membership:
              user?.is_elgible_for_elite_membership,
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
        users = await UserModel.find(query).sort({ created_at: -1 });
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 });
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
            ethnicity: user?.ethnicity,
            interest: user?.interest,
            hobbies: user?.hobbies,
            country: user?.country,
            city: user?.city,
            postalCode: user?.postalCode,
            is_invited_for_elite_membership:
              user?.is_invited_for_elite_membership,
            is_elgible_for_executive_membership:
              user?.is_elgible_for_executive_membership,
            is_elgible_for_elite_membership:
              user?.is_elgible_for_elite_membership,
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
        users = await UserModel.find(query).sort({ created_at: -1 });
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        users = await UserModel.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ created_at: -1 });
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
            ethnicity: user?.ethnicity,
            interest: user?.interest,
            hobbies: user?.hobbies,
            country: user?.country,
            city: user?.city,
            postalCode: user?.postalCode,
            is_invited_for_elite_membership:
              user?.is_invited_for_elite_membership,
            is_elgible_for_executive_membership:
              user?.is_elgible_for_executive_membership,
            is_elgible_for_elite_membership:
              user?.is_elgible_for_elite_membership,
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

      if (!currentPassword || !newPassword || !confirmPassword)
        throw createError.BadRequest("Required fields are missing");

      if (newPassword !== confirmPassword)
        throw createError.BadRequest("Confirm Password is not matching");

      let user = await UserModel.findById(id);

      if (!user) throw createError.BadRequest("User not found");

      if (user.role?.toLowerCase() !== "admin")
        throw createError.Unauthorized("Unauthorized");

      let checkPassword = await user.isValidPassword(currentPassword);

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
  get_inperson_registration: async (req, res, next) => {
    try {
      let registrations = await InpersonRegistrationModel.find().sort({
        created_at: -1,
      });

      res.status(200).json({
        message: "Inperson Registrations Retrieved Successfully",
        data: registrations,
      });
    } catch (err) {
      next(err);
    }
  },
  delete_inperson_registration: async (req, res, next) => {
    try {
      let id = req.params.id;

      let deleteData = await InpersonRegistrationModel.findByIdAndDelete(id);

      res.status(200).json({
        message: "Data deleted successfully",
        status: true,
        data: deleteData,
      });
    } catch (err) {
      next(err);
    }
  },
  is_eligible_for_executive: async (req, res, next) => {
    try {
      let id = req.params.id;

      let allPremiumMembership = await MembershipHistoryModel.find({
        package_name: "Premium Membership",
        userId: id,
      });
      const lastMembership = await MembershipHistoryModel.findOne().sort({
        created_at: -1,
      });

      if (!allPremiumMembership || allPremiumMembership.length == 0) {
        res.status(401).json({
          message: "You are not eligible for executive membership",
          totalDays: 0,
          remainingDays: 180,
          status: false,
        });
      }

      let allDays =
        allPremiumMembership &&
        allPremiumMembership?.length > 0 &&
        allPremiumMembership?.reduce((pre, curr) => {
          return (
            (Number(pre) || 0) + (Number(curr?.membership_duration_days) || 0)
          );
        }, 0);

      let lastMembershipDays = 0;

      if (
        lastMembership &&
        lastMembership?.package_name == "Premium Membership"
      ) {
        const { purchase_date, expiry_date } = lastMembership;

        const purchaseDate = new Date(purchase_date);
        const expiryDate = new Date(expiry_date);
        const currentDate = new Date();

        const totalDurationDays = Math.ceil(
          (expiryDate - purchaseDate) / (1000 * 60 * 60 * 24)
        );

        const remainingDays = Math.ceil(
          (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
        );

        let totalDays = totalDurationDays - remainingDays;

        if (currentDate >= expiryDate) {
          lastMembershipDays = totalDurationDays;
        } else {
          lastMembershipDays = totalDays;
        }
      }

      let totalDays = Number(allDays) + Number(lastMembershipDays);

      if (totalDays > 180) {
        let user = await UserModel.findById(id);

        if (user && !user?.is_elgible_for_executive_membership) {
          user.is_elgible_for_executive_membership = true;
          await user.save();
        }

        res.status(200).json({
          message: "You are eligible for executive membership",
          totalDays: totalDays,
          remainingDays: 180 - totalDays,
          status: true,
        });
      } else {
        res.status(200).json({
          message: "You are not eligible for executive membership",
          totalDays: totalDays,
          remainingDays: 180 - totalDays,
          status: false,
        });
      }
    } catch (err) {
      next(err);
    }
  },
  is_eligible_for_elite: async (req, res, next) => {
    try {
      let id = req.params.id;

      let allExecutiveMembership = await MembershipHistoryModel.find({
        package_name: "Executive Membership",
        userId: id,
      });
      const lastMembership = await MembershipHistoryModel.findOne().sort({
        created_at: -1,
      });

      if (!allExecutiveMembership || allExecutiveMembership.length == 0) {
        res.status(401).json({
          message: "You are not eligible for elite membership",
          totalDays: 0,
          remainingDays: 180,
          status: false,
        });
      }

      let allDays =
        allExecutiveMembership &&
        allExecutiveMembership?.length > 0 &&
        allExecutiveMembership?.reduce((pre, curr) => {
          return (
            (Number(pre) || 0) + (Number(curr?.membership_duration_days) || 0)
          );
        }, 0);

      let lastMembershipDays = 0;

      if (
        lastMembership &&
        lastMembership?.package_name == "Executive Membership"
      ) {
        const { purchase_date, expiry_date } = lastMembership;

        const purchaseDate = new Date(purchase_date);
        const expiryDate = new Date(expiry_date);
        const currentDate = new Date();

        const totalDurationDays = Math.ceil(
          (expiryDate - purchaseDate) / (1000 * 60 * 60 * 24)
        );

        const remainingDays = Math.ceil(
          (expiryDate - currentDate) / (1000 * 60 * 60 * 24)
        );

        let totalDays = totalDurationDays - remainingDays;

        if (currentDate >= expiryDate) {
          lastMembershipDays = totalDurationDays;
        } else {
          lastMembershipDays = totalDays;
        }
      }

      let totalDays = Number(allDays) + Number(lastMembershipDays);

      if (totalDays > 180) {
        let user = await UserModel.findById(id);

        if (user && !user?.is_elgible_for_elite_membership) {
          user.is_elgible_for_elite_membership = true;
          await user.save();
        }

        res.status(200).json({
          message: "You are eligible for elite membership",
          totalDays: totalDays,
          remainingDays: 180 - totalDays,
          status: true,
        });
      } else {
        res.status(200).json({
          message: "You are not eligible for elite membership",
          totalDays: totalDays,
          remainingDays: 180 - totalDays,
          status: false,
        });
      }
    } catch (err) {
      next(err);
    }
  },
  get_eligible_non_invited_members: async (req, res, next) => {
    try {
      let users = await UserModel.find({
        is_elgible_for_elite_membership: true,
        is_invited_for_elite_membership: false,
      });

      res.status(200).json({
        message: "Users Successfully Retrieved",
        data: users,
      });
    } catch (err) {
      next(err);
    }
  },
  invite_for_elite_membership: async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      let { email } = req.body;

      if (!email) throw createError.BadRequest("Email Not Found");

      let user = await UserModel.findOne({ email: email }).session(session);
      if (!user) throw createError.BadRequest("User Not Found");

      user.is_invited_for_elite_membership = true;
      await user.save({ session });

      let subject = "Invitation for Elite Membership";
      let message = `Dear Member,
      
      You are invited to apply for elite membership in our club. You can purchase elite membership in the app membership packages section.`;

      await sendEmail(email, subject, message);

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Invitation sent successfully",
        data: user,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  },
};

module.exports = UserController;
