const createError = require("http-errors");
const UserModel = require("../Models/user.model");
const {
  authSchema,
  updateUserSchema,
} = require("../../helper/validation_schema");
const path = require("path");
const fs = require("fs");

const UserController = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;

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
        is_fee_paid: user?.is_fee_paid,
        profile_pic: user?.profile_pic,
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
      console.log(err, "errr");
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
};

module.exports = UserController;
