const createError = require("http-errors");
const {
  authSchema,
  loginSchema,
  approvedUserSchema,
  changePasswordSchema,
  partnerSchema,
} = require("../../helper/validation_schema");
const UserModel = require("../Models/user.model");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../../helper/jwt_helper");
const {
  generateRandomPassword,
  generateMembershipID,
  generateUsername,
  generateOTP,
  generateCardNumber,
} = require("../../helper/generate_random_passwords");
const mongoose = require("mongoose");
const { sendEmail } = require("../../helper/send_email");
const client = require("../../helper/redis_init");
const path = require("path");
const fs = require("fs");
const MembershipModel = require("../Models/membership.model");
const bcrypt = require("bcrypt");

const AuthController = {
  registerUser: async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    let files = req.files;
    let profileImage = files?.profileImage;
    let partnerImage = files?.partnerImage;
    let profileImageName = profileImage?.[0]?.filename;
    let partnerImageName = partnerImage?.[0]?.filename;

    try {
      let userData = req.body;

      let {
        registration_type,
        couples_type,
        gender,
        full_name,
        date_of_birth,
        email,
        phone_number,
        address,
        occupation,
        height,
        weight,
        sexuality,
        life_style,
        wanted_experience,
        user_quality,
        partner_details,
        is_agree_terms_and_conditions,
      } = userData;

      if (!profileImageName)
        throw createError.BadRequest("Required Fields Are Missing");

      if (registration_type?.toLowerCase() === "couples" && !partnerImageName)
        throw createError.BadRequest("Required Fields Are Missing");

      if (
        !registration_type ||
        !gender ||
        !full_name ||
        !date_of_birth ||
        !email ||
        !phone_number ||
        !address ||
        !occupation ||
        !height ||
        !weight ||
        !sexuality ||
        !life_style ||
        !wanted_experience ||
        !user_quality
      )
        throw createError.BadRequest("Required Fields Are Missing");

      if (
        !is_agree_terms_and_conditions ||
        is_agree_terms_and_conditions == "false"
      )
        throw createError.BadRequest("must agree terms and conditions");

      userData.profile_pic = profileImageName;

      userData.phone_number = userData?.phone_number?.split(" ").join("");

      let default_membership = await MembershipModel.findOne({
        default_membership: true,
      });

      userData.membership = default_membership;

      let result = await authSchema.validateAsync(userData);

      const existingUser = await UserModel.findOne({
        email: result.email,
      }).session(session);

      if (existingUser)
        return next(
          createError.Conflict(
            registration_type?.toLowerCase() == "couples"
              ? `Member1 email already exists`
              : `This email already exists`
          )
        );

      if (
        registration_type?.toLowerCase() === "couples" &&
        (!partner_details || Object.keys(partner_details).length === 0)
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      let partnerUser;

      if (registration_type?.toLowerCase() === "couples") {
        let {
          registration_type,
          couples_type,
          gender,
          full_name,
          date_of_birth,
          email,
          phone_number,
          address,
          occupation,
          height,
          weight,
          sexuality,
          life_style,
          wanted_experience,
          user_quality,
          is_agree_terms_and_conditions,
        } = partner_details;

        if (
          !registration_type ||
          !gender ||
          !full_name ||
          !date_of_birth ||
          !email ||
          !phone_number ||
          !address ||
          !occupation ||
          !height ||
          !weight ||
          !sexuality ||
          !life_style ||
          !wanted_experience ||
          !user_quality
        )
          throw createError.BadRequest("Required Fields Are Missing");

        if (
          !is_agree_terms_and_conditions ||
          is_agree_terms_and_conditions === "false"
        )
          throw createError.BadRequest("Must agree terms and conditions");

        partner_details.profile_pic = partnerImageName;
        partner_details.phone_number = partner_details?.phone_number
          ?.split(" ")
          .join("");

        partner_details.membership = default_membership;
        let partnerData = await partnerSchema.validateAsync(partner_details);

        const existingPartnerUser = await UserModel.findOne({
          email: partnerData.email,
        }).session(session);

        if (existingPartnerUser) {
          await session.abortTransaction();
          session.endSession();
          next(createError.Conflict(`Member 2 email already exists`));
          return;
        }

        const user = new UserModel({
          registration_type: partnerData?.registration_type,
          couples_type: partnerData?.couples_type,
          registration_fee: partnerData?.registration_fee,
          gender: partnerData?.gender,
          date_of_birth: partnerData?.date_of_birth,
          phone_number: partnerData?.phone_number,
          address: partnerData?.address,
          occupation: partnerData?.occupation,
          height: partnerData?.height,
          weight: partnerData?.weight,
          sexuality: partnerData?.sexuality,
          life_style: partnerData?.life_style,
          wanted_experience: partnerData?.wanted_experience,
          user_quality: partnerData?.user_quality,
          profile_pic: partnerImageName,
          is_agree_terms_and_conditions:
            partnerData?.is_agree_terms_and_conditions,
          membership: partner_details?.membership,
          full_name: partnerData.full_name,
          email: partnerData.email,
          account_created_by: result?.email,
        });

        const newUser = await user.save();
        partnerUser = newUser;
      }

      const user = new UserModel({
        registration_type: result?.registration_type,
        couples_type: result?.couples_type,
        registration_fee: result?.registration_fee,
        gender: result?.gender,
        date_of_birth: result?.date_of_birth,
        phone_number: result?.phone_number,
        address: result?.address,
        occupation: result?.occupation,
        height: result?.height,
        weight: result?.weight,
        sexuality: result?.sexuality,
        life_style: result?.life_style,
        wanted_experience: result?.wanted_experience,
        user_quality: result?.user_quality,
        membership: result?.membership,
        profile_pic: profileImageName,
        is_agree_terms_and_conditions: result?.is_agree_terms_and_conditions,
        full_name: result.full_name,
        account_created_by: result?.email,
        partner_ref: partnerUser?.id,
        email: result.email,
      });

      const newUser = await user.save();

      let updatePartnerUser;
      if (partnerUser) {
        const updateSession = await mongoose.startSession();
        updateSession.startTransaction();

        try {
          updatePartnerUser = await UserModel.findByIdAndUpdate(
            partnerUser.id,
            { $set: { partner_ref: newUser.id } },
            { new: true }
          ).session(updateSession);

          await updateSession.commitTransaction();
        } catch (updateError) {
          await updateSession.abortTransaction();
          throw createError.InternalServerError();
        } finally {
          updateSession.endSession();
        }
      }
      const accessToken = await signAccessToken(newUser.id);
      const refreshToken = await signRefreshToken(newUser.id);

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "User Successfully Registered",
        data: newUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      if (profileImageName) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/profileImages/${profileImageName}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (partnerImageName) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/profileImages/${partnerImageName}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (err.isJoi === true) {
        next(createError.BadRequest(err.message || "Invalid Fields"));
        return;
      }
      next(err);
    }
  },
  login: async (req, res, next) => {
    try {
      let { username, password } = req.body;

      if (!password || !username)
        throw createError?.BadRequest("Required fields are missing");

      const result = await loginSchema.validateAsync(req.body);

      let user;

      user = await UserModel.findOne({ membership_id: username });

      if (!user || user.length == 0) {
        user = await UserModel.findOne({ username: username });
      }

      if (!user || user?.length == 0) {
        throw createError.NotFound("User Not Found");
      }

      let checkPassword = await user.isValidPassword(result?.password);

      if (!checkPassword) {
        throw createError.Unauthorized("Invalid Username/Password");
      }

      if (user?.user_status?.toLowerCase() == "pending") {
        throw createError?.Unauthorized("Your Profile is in pending");
      }

      if (user?.user_status?.toLowerCase() == "blocked") {
        throw createError?.Unauthorized("Your Profile has been blocked");
      }

      const accessToken = await signAccessToken(user.id);

      const refreshToken = await signRefreshToken(user.id);

      let dataToSend = {
        registration_type: user?.registration_type,
        couples_type: user?.couples_type,
        gender: user?.gender,
        full_name: user?.full_name,
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
        wanted_experience: user?.wanted_experience,
        user_quality: user?.user_quality,
        user_status: user?.user_status,
        profile_pic: user?.profile_pic,
        username: user?.username,
        membership: user?.membership,
        card_number: user?.card_number,
        membership_id: user?.membership_id,
        is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
        role: user?.role,
      };

      res.status(200).json({
        message: "User Successfully Logged In",
        data: dataToSend,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (err) {
      if (err.isJoi) next(createError?.BadRequest("Invalid Fields"));

      next(err);
    }
  },
  approvedUser: async (req, res, next) => {
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      let { email } = req.body;

      if (!email) {
        throw createError.BadRequest("Required fields are missing");
      }

      const result = await approvedUserSchema.validateAsync(req.body);

      let user = await UserModel.findOne({ email: result.email }).session(
        session
      );

      if (!user || user.length === 0) {
        throw createError.NotFound("User not found");
      }

      if (user.user_status.toLowerCase() === "approved") {
        throw createError.BadRequest("The user has already been approved");
      }

      const password = await generateRandomPassword(15);
      const membership_id = await generateMembershipID(15);
      const username = await generateUsername(user);
      const cardNumber = await generateCardNumber();

      user.membership_id = membership_id;

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      password = hashPassword;

      user.password = password;
      user.username = username;
      user.card_number = cardNumber;
      user.user_status = "approved";
      user.approved_date = new Date();

      // Save changes within the session
      const savedUser = await user.save({ session });

      let subject = "Registration Approval";
      let message = `Your id has been successfully approved below are your login credentials.
      
      <br/>

      username: ${username}

      <br/>

      password: ${password}
      
      <br/>
    
      membership id: ${membership_id}

      
      <br/>

      card number: ${cardNumber}
      
      `;

      const mailInfo = await sendEmail(user.email, subject, message);

      if (mailInfo && mailInfo.messageId) {
        await session.commitTransaction();
        res.status(200).json({
          message: "User approved successfully",
        });
      } else {
        throw createError.InternalServerError("Failed to send email");
      }
    } catch (err) {
      if (session) {
        await session.abortTransaction();
      }
      if (err.isJoi) next(createError?.BadRequest("Invalid Email"));
      next(err);
    } finally {
      if (session) {
        session.endSession();
      }
    }
  },
  blockedUser: async (req, res, next) => {
    try {
      let { email } = req.body;

      if (!email) throw createError.BadRequest();

      let user = await UserModel.findOneAndUpdate(
        { email: email },
        { user_status: "blocked" },
        { new: true }
      );

      if (!user) {
        throw createError.NotFound("User not found");
      }

      res.status(200).json({
        message: "User has been blocked successfully",
      });
    } catch (err) {
      next(err);
    }
  },
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      if (!email) throw createError?.BadRequest("Email is missing");

      let user = await UserModel.findOne({ email: email });

      if (!user || user.length == 0)
        return next(createError.NotFound("User not found"));

      if (!user?.user_status || user?.user_status?.toLowerCase() == "pending") {
        return next(
          createError.NotFound("Approval pending. Password unchanged.")
        );
      }

      let otp = await generateOTP();

      let subject = "Forget passwod otp";

      let message = `Here is your otp code ${otp}`;

      let mailInfo = await sendEmail(email, subject, message);

      if (mailInfo && mailInfo.messageId) {
        res.status(200).json({
          message: "Otp code successfully send in email",
          otp: otp,
        });
      } else {
        throw createError.InternalServerError(
          "Failed to send otp code in email"
        );
      }
    } catch (err) {
      if (err.isJoi) return next(createError.BadRequest("Invalid Email"));

      next(err);
    }
  },
  changePassword: async (req, res, next) => {
    try {
      let { email, password, confirm_password } = req.body;

      if (!email || !password || !confirm_password)
        throw createError.BadRequest("Required fields are missing");

      let result = await changePasswordSchema.validateAsync(req.body);

      let user = await UserModel.findOne({ email: email });

      if (!user || user.length === 0) {
        return next(createError.NotFound("User not found"));
      }

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      user.password = hashPassword;

      await user.save();

      res.status(200).json({
        message: "Password successfully changed",
      });
    } catch (err) {
      if (err.isJoi) return next(createError.BadRequest());

      next(err);
    }
  },
  refreshToken: async (req, res, next) => {
    try {
      let { refreshToken } = req.body;

      if (!refreshToken) {
        throw createError.BadRequest("Unauthorized");
      }

      const userId = await verifyRefreshToken(refreshToken);

      const accessToken = await signAccessToken(userId);

      res.json({
        accessToken: accessToken,
      });
    } catch (error) {
      next(error);
    }
  },
  signout: async (req, res, next) => {
    const token = req.params.token;

    try {
      if (!token) throw createError.Unauthorized();

      const userId = await verifyRefreshToken(token);

      let value = await client.DEL(userId);

      res.status(204).json({
        message: "Successfully Logged Out",
        data: {},
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
