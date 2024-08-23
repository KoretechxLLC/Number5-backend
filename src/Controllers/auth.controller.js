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
const InpersonRegistrationModel = require("../Models/inperson.registration.model");
const stripe = require("stripe")(process.env.STRIPE_SK);

const AuthController = {
  inPersonRegistration: async (req, res, next) => {
    let { files, body } = req;

    let profileImage = files?.profileImage?.[0]?.filename;
    let idCardImage = files?.idCardImage?.[0]?.filename;

    let partnerProfileImage = files?.profileImagePartner?.[0]?.filename;
    let partnerIdCardImage = files?.idCardImagePartner?.[0]?.filename;

    try {
      let {
        first_name,
        last_name,
        phone_number,
        message,
        date,
        time,
        registration_type,
        address,
        gender,
        partner_details,
      } = body;

      if (
        !first_name ||
        !last_name ||
        !phone_number ||
        !message ||
        !date ||
        !time ||
        !registration_type ||
        !profileImage ||
        !idCardImage ||
        !gender
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      // Additional checks for couple registration
      if (registration_type?.toLowerCase() === "couple") {
        if (!partnerProfileImage || !partnerIdCardImage) {
          throw createError.BadRequest("Partner's required images are missing");
        }
        if (
          !partner_details?.first_name ||
          !partner_details?.last_name ||
          !partner_details?.phone_number ||
          !partner_details?.gender
        ) {
          throw createError.BadRequest("Partner's required fields are missing");
        }
      }

      // Check if phone number already exists in UserModel or InpersonRegistrationModel
      let checkNumber = await UserModel.findOne({ phone_number });
      if (checkNumber) {
        throw createError.BadRequest("Phone number already exists");
      }

      let checkNumberInPerson = await InpersonRegistrationModel.findOne({
        phone_number,
      });
      if (checkNumberInPerson) {
        throw createError.BadRequest("Phone number already exists");
      }

      if (registration_type?.toLowerCase() === "couple") {
        let partnerPhone = partner_details?.phone_number;
        let partnerCheck = await UserModel.findOne({
          phone_number: partnerPhone,
        });
        if (partnerCheck) {
          throw createError.BadRequest("Partner's phone number already exists");
        }

        let partnerCheckInPerson = await InpersonRegistrationModel.findOne({
          phone_number: partnerPhone,
        });
        if (partnerCheckInPerson) {
          throw createError.BadRequest("Partner's phone number already exists");
        }
      }

      let dataToSend;

      if (registration_type.toLowerCase() == "couple") {
        dataToSend = {
          first_name,
          last_name,
          phone_number,
          date,
          time,
          registration_type,
          profile_pic: profileImage,
          id_card: idCardImage,
          message,
          address,
          gender,
          partner_profile_pic: partnerProfileImage,
          partner_id_card: partnerIdCardImage,
          partner_details,
        };
      } else {
        dataToSend = {
          first_name,
          last_name,
          phone_number,
          date,
          time,
          address,
          registration_type,
          profile_pic: profileImage,
          id_card: idCardImage,
          message,
          gender,
        };
      }

      let userData = await InpersonRegistrationModel.create(dataToSend);

      res.status(200).json({
        message: "Form successfully submitted",
        status: true,
        data: userData,
      });
    } catch (err) {
      const deleteFile = (filename) => {
        const destinationFolder = path.join(
          __dirname,
          `../../public/profileImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error(`Error deleting file: ${filename}`);
          }
        });
      };

      if (profileImage) deleteFile(profileImage);
      if (idCardImage) deleteFile(idCardImage);
      if (partnerProfileImage) deleteFile(partnerProfileImage);
      if (partnerIdCardImage) deleteFile(partnerIdCardImage);

      next(err);
    }
  },

  registerUser: async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    let files = req.files;
    let profileImage = files?.profileImage;
    let partnerImage = files?.partnerImage;
    let profileImageName = profileImage?.[0]?.filename;
    let partnerImageName = partnerImage?.[0]?.filename;
    let stripeData;

    try {
      let userData = req.body;

      let {
        registration_type,
        gender,
        first_name,
        last_name,
        date_of_birth,
        email,
        phone_number,
        country,
        city,
        postalCode,
        ethnicity,
        interest,
        hobbies,
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
        token,
        amount,
      } = userData;

      if (!profileImageName)
        throw createError.BadRequest(
          `Invalid ${
            registration_type?.toLowerCase() === "couple"
              ? "Member1 Profile"
              : "Profile"
          } Image`
        );

      if (registration_type?.toLowerCase() === "couple" && !partnerImageName)
        throw createError.BadRequest("Invalid Member2 Profile Image");

      if (!registration_type) {
        throw createError.BadRequest("Registration type is required.");
      }

      if (!gender) {
        throw createError.BadRequest("Gender is required.");
      }

      if (!first_name) {
        throw createError.BadRequest("First name is required.");
      }

      if (!last_name) {
        throw createError.BadRequest("Last name is required.");
      }

      if (!date_of_birth) {
        throw createError.BadRequest("Date of birth is required.");
      }

      if (!email) {
        throw createError.BadRequest("Email is required.");
      }

      if (!phone_number) {
        throw createError.BadRequest("Phone number is required.");
      }

      if (!address) {
        throw createError.BadRequest("Address is required.");
      }

      if (!occupation) {
        throw createError.BadRequest("Occupation is required.");
      }

      if (!interest) {
        throw createError.BadRequest("Interest is required.");
      }

      if (!hobbies) {
        throw createError.BadRequest("Hobbies are required.");
      }

      if (!ethnicity) {
        throw createError.BadRequest("Ethnicity is required.");
      }

      if (!country) {
        throw createError.BadRequest("Country is required.");
      }

      if (!city) {
        throw createError.BadRequest("City is required.");
      }

      if (!postalCode) {
        throw createError.BadRequest("Postal code is required.");
      }

      if (!height) {
        throw createError.BadRequest("Height is required.");
      }

      if (!weight) {
        throw createError.BadRequest("Weight is required.");
      }

      if (!sexuality) {
        throw createError.BadRequest("Sexuality is required.");
      }

      if (!life_style) {
        throw createError.BadRequest("Life style is required.");
      }

      if (!wanted_experience) {
        throw createError.BadRequest("Wanted experience is required.");
      }

      if (!user_quality) {
        throw createError.BadRequest("User quality is required.");
      }

      // if (!amount) {
      //   throw createError.BadRequest("amount is required.");
      // }

      // if (!token) {
      //   throw createError.BadRequest("card token is required.");
      // }

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
            registration_type?.toLowerCase() == "couple"
              ? `Member1 email already exists`
              : `This email already exists`
          )
        );

      let isPhoneNumberExists = await UserModel.findOne({
        phone_number: result?.phone_number,
      });

      if (isPhoneNumberExists) {
        return next(
          createError.Conflict(
            registration_type?.toLowerCase() == "couple"
              ? `Member1 phone number already exists`
              : `This phone number already exists`
          )
        );
      }

      if (
        registration_type?.toLowerCase() === "couple" &&
        (!partner_details || Object.keys(partner_details).length === 0)
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      let partnerUser;

      if (registration_type?.toLowerCase() === "couple") {
        let {
          registration_type,
          couples_type,
          gender,
          first_name,
          last_name,
          date_of_birth,
          email,
          phone_number,
          address,
          occupation,
          country,
          city,
          postalCode,
          ethnicity,
          interest,
          hobbies,
          height,
          weight,
          sexuality,
          life_style,
          wanted_experience,
          user_quality,
          is_agree_terms_and_conditions,
        } = partner_details;

        if (!registration_type) {
          throw createError.BadRequest("Registration type is required.");
        }

        if (!gender) {
          throw createError.BadRequest("Gender is required.");
        }

        if (!first_name) {
          throw createError.BadRequest("First name is required.");
        }

        if (!last_name) {
          throw createError.BadRequest("Last name is required.");
        }

        if (!date_of_birth) {
          throw createError.BadRequest("Date of birth is required.");
        }

        if (!email) {
          throw createError.BadRequest("Email is required.");
        }

        if (!phone_number) {
          throw createError.BadRequest("Phone number is required.");
        }

        if (!address) {
          throw createError.BadRequest("Address is required.");
        }

        if (!occupation) {
          throw createError.BadRequest("Occupation is required.");
        }

        if (!interest) {
          throw createError.BadRequest("Interest is required.");
        }

        if (!hobbies) {
          throw createError.BadRequest("Hobbies are required.");
        }

        if (!ethnicity) {
          throw createError.BadRequest("Ethnicity is required.");
        }

        if (!country) {
          throw createError.BadRequest("Country is required.");
        }

        if (!city) {
          throw createError.BadRequest("City is required.");
        }

        if (!postalCode) {
          throw createError.BadRequest("Postal code is required.");
        }

        if (!height) {
          throw createError.BadRequest("Height is required.");
        }

        if (!weight) {
          throw createError.BadRequest("Weight is required.");
        }

        if (!sexuality) {
          throw createError.BadRequest("Sexuality is required.");
        }

        if (!life_style) {
          throw createError.BadRequest("Life style is required.");
        }

        if (!wanted_experience) {
          throw createError.BadRequest("Wanted experience is required.");
        }

        if (!user_quality) {
          throw createError.BadRequest("User quality is required.");
        }

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

        let isPhoneNumberExists = await UserModel.findOne({
          phone_number: partnerData?.phone_number,
        });

        if (isPhoneNumberExists) {
          await session.abortTransaction();
          session.endSession();
          return next(
            createError.Conflict(
              registration_type?.toLowerCase() == "couple"
                ? `Member2 phone number already exists`
                : `This phone number already exists`
            )
          );
        }

        const user = new UserModel({
          registration_type: partnerData?.registration_type,
          couples_type: partnerData?.couples_type,
          registration_fee: partnerData?.registration_fee,
          ethnicity: partnerData?.ethnicity,
          interest: partnerData?.interest,
          hobbies: partnerData?.hobbies,
          country: partnerData?.country,
          city: partnerData?.city,
          postalCode: partnerData?.postalCode,
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
          first_name: partnerData.first_name,
          last_name: partnerData?.last_name,
          email: partnerData.email,
          account_created_by: result?.email,
        });

        const newUser = await user.save({ session });
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
        ethnicity: result?.ethnicity,
        interest: result?.interest,
        hobbies: result?.hobbies,
        country: result?.country,
        city: result?.city,
        postalCode: result?.postalCode,
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
        first_name: result.first_name,
        last_name: result?.last_name,
        account_created_by: result?.email,
        partner_ref: partnerUser?.id,
        email: result.email,
      });

      const newUser = await user.save({ session });

      if (token && amount) {
        try {
          stripeData = await stripe.paymentIntents.create({
            amount: Math.ceil(amount * 100), // Amount in cents
            currency: "ttd",
            payment_method: token,
            confirm: true,
            description: `Registration fee charges for numberfive club`,
            receipt_email: userData.email,
            metadata: {
              userId: userData?.id,
              username: userData?.first_name,
              email: userData?.email,
              description: `Registration fee charges for numberfive club`,
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

      const accessToken = await signAccessToken(newUser.id);
      const refreshToken = await signRefreshToken(newUser.id);

      await session.commitTransaction();
      session.endSession();

      let updatePartnerUser;

      console.log(partnerUser, "userrr");

      if (partnerUser) {
        updatePartnerUser = await UserModel.findByIdAndUpdate(
          partnerUser.id,
          { $set: { partner_ref: newUser.id } },
          { new: true }
        );
      }

      let userEmail = newUser?.email;
      let subject = "Welcome to Number Five Club – Application Received!";
      let body = `
      
      <p>Dear ${newUser.first_name},</p>
 
<p>Thank you for registering with Number Five Club! We are excited to inform you that your application has been successfully received and is currently being processed.</p>
 
<p>Please allow us a maximum of 7 days to review your application. You will receive a notification once your application status is updated.</p>
 
<p>Thank you for your patience, and welcome to our community!</p>
 
Best regards,`;
      try {
        let mailInfo = await sendEmail(userEmail, subject, body);

        if (partnerUser) {
          let mailInfo2 = await sendEmail(partnerUser?.email, subject, body);
        }
      } catch (err) {
        console.log(error, "errorr");
      }

      res.status(200).json({
        message: "User Successfully Registered",
        data: newUser,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
    } catch (err) {
      if (stripeData?.id) {
        try {
          await stripe.refunds.create({ payment_intent: stripeData?.id });
        } catch (refundError) {
          console.error("Failed to refund Stripe payment:", refundError);
        }
      }

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
  checkUserEmailAndPhoneNumber: async (req, res, next) => {
    try {
      let { email, phone_number, screen } = req.body;

      if (!email || !phone_number)
        throw createError.BadRequest("Required fields are missing");

      if (screen == "inperson") {
        phone_number = phone_number?.split(" ").join("");

        let isPhoneNumberExists = await InpersonRegistrationModel.findOne({
          phone_number: phone_number,
        });

        if (isPhoneNumberExists)
          throw createError.BadRequest("Phone number already exists");

        res.status(200).json({
          message: "Username and password not registered",
        });
        return;
      }
      let isEmailExists = await UserModel.findOne({ email: email });

      if (isEmailExists) throw createError.BadRequest("Email already exists");

      phone_number = phone_number?.split(" ").join("");

      let isPhoneNumberExists = await UserModel.findOne({
        phone_number: phone_number,
      });

      if (isPhoneNumberExists)
        throw createError.BadRequest("Phone number already exists");

      res.status(200).json({
        message: "Username and password not registered",
      });
    } catch (err) {
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

      if (user?.user_status?.toLowerCase() == "inactive") {
        throw createError?.Unauthorized(
          "Your account has been blocked. Contact support for details."
        );
      }

      const accessToken = await signAccessToken(user.id);

      const refreshToken = await signRefreshToken(user.id);

      let dataToSend = {
        registration_type: user?.registration_type,
        couples_type: user?.couples_type,
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
        ethnicity: user?.ethnicity,
        interest: user?.interest,
        hobbies: user?.hobbies,
        country: user?.country,
        city: user?.city,
        postalCode: user?.postalCode,
        is_invited_for_elite_membership: user?.is_invited_for_elite_membership,
        is_elgible_for_executive_membership:
          user?.is_elgible_for_executive_membership,
        is_elgible_for_elite_membership: user?.is_elgible_for_elite_membership,
        wanted_experience: user?.wanted_experience,
        user_quality: user?.user_quality,
        user_status: user?.user_status,
        profile_pic: user?.profile_pic,
        username: user?.username,
        membership: user?.membership,
        card_number: user?.card_number,
        membership_id: user?.membership_id,
        token: user?.token,
        event_visits: user?.event_visits,
        push_notification_option: user?.push_notification_option,
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

      if (
        user &&
        user?.user_status &&
        user?.user_status?.toString().toLowerCase() == "approved"
      ) {
        throw createError.BadRequest("The user has already been approved");
      }

      let password = await generateRandomPassword(8);
      const membership_id = await generateMembershipID(15);
      const username = await generateUsername(user);
      const cardNumber = await generateCardNumber();

      user.membership_id = membership_id;
      const emailPassword = password;

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      password = hashPassword;

      user.password = password;
      user.username = username;
      user.card_number = cardNumber;
      user.user_status = "approved";
      user.approved_date = new Date();

      const savedUser = await user.save({ session });

      let subject =
        "Welcome to Number Five Club – Your Application Has Been Approved!";
      let message = `Dear ${user?.first_name}.


        <br/>
        <br/>


      <p>Congratulations! We are pleased to inform you that your application to join Number Five Club has been approved.</p>

       <p>You can now access your member account using the login credentials below:</p>
      
      username: ${username}
      <br/>
      password: ${emailPassword}
      <br/>
      membership id: ${membership_id}
      <br/>
      card number: ${cardNumber}

      <br/>
      <br/>

       <p>We encourage you to log in and explore all the benefits and resources available to our members.</p>
      
       <p>Welcome aboard, and we look forward to having you as part of our community!</p>
      
      Best regards,

      
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
