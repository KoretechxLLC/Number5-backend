const createError = require("http-errors");
const {
  authSchema,
  loginSchema,
  approvedUserSchema,
} = require("../../helper/validation_schema");
const UserModel = require("../Models/user.model");
const {
  signAccessToken,
  signRefreshToken,
} = require("../../helper/jwt_helper");
const {
  generateRandomPassword,
  generateMembershipID,
  generateUsername,
} = require("../../helper/generate_random_passwords");
const mongoose = require("mongoose");
const { sendEmail } = require("../../helper/send_email");

const AuthController = {
  registerUser: async (req, res, next) => {
    try {
      let userData = req.body;

      let {
        registration_type,
        couples_type,
        event_fee,
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
      } = userData;

      let profileImageName = req.file?.filename;

      if (!profileImageName)
        throw createError.BadRequest("Required Fields Are Missing");

      if (
        !registration_type ||
        !couples_type ||
        !event_fee ||
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

      let result = await authSchema.validateAsync(userData);

      const existingUser = await UserModel.findOne({ email: result.email });

      if (existingUser) throw createError.Conflict(`This email already exists`);

      const user = new UserModel({
        registration_type: result?.registration_type,
        couples_type: result?.couples_type,
        event_fee: result?.event_fee,
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
        profile_pic: profileImageName,
        is_agree_terms_and_conditions: result?.is_agree_terms_and_conditions,
        full_name: result.full_name,
        email: result.email,
      });

      const newUser = await user.save();

      const accessToken = await signAccessToken(newUser.id);

      const refreshToken = await signRefreshToken(newUser.id);

      res.status(200).json({
        message: "User Successfully Registered",
        data: newUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (err) {
      console.log(err, "err");
      if (err.isJoi === true) {
        next(createError.BadRequest());
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
        event_fee: user?.event_fee,
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
        is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
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
      const membership_id = await generateMembershipID(25);
      const username = await generateUsername(user);

      user.membership_id = membership_id;
      user.password = password;
      user.username = username;
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

        let {email} = req.body

        if(!email) throw createError.BadRequest()

        let user = await UserModel.findOneAndUpdate({email:email},{user_status : "blocked"},{new : true})

        if(!user){

            throw createError.NotFound("User not found")

        }

        res.status(200).json({
            message  : "User has been blocked successfully",
        })
    
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
