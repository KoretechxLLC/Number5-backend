const createError = require("http-errors");
const { RegistrationTypeSchema } = require("../../helper/validation_schema");
const RegistrationTypeModel = require("../Models/registrationtype.model");
const path = require("path");
const fs = require("fs");

const RegistrationTypeController = {
  createType: async (req, res, next) => {
    try {
      let { registration_type, couples_type } = req.body;

      const filename = req?.file?.filename;

      if (!filename)
        throw createError.BadRequest("Required fields are missing");

      if (
        !registration_type ||
        (registration_type?.toLowerCase() == "couples" && !couples_type)
      )
        throw createError.BadRequest("Required fields are missing");

      if (registration_type?.toLowerCase() == "single" && couples_type)
        throw createError.BadRequest("Cannot add couples type in type single");

      let registrationData = {
        registration_type: registration_type,
        couples_type: couples_type,
        image_path: filename,
      };

      let result = await RegistrationTypeSchema.validateAsync(registrationData);

      let newRegistrationType = new RegistrationTypeModel({
        registration_type: result.registration_type,
        couples_type: result?.couples_type,
        image_path: result?.image_path,
      });

      const newRegistration = await newRegistrationType.save();

      res.status(200).json({
        message: "Registration Type Successfully Created",
        data: newRegistration,
      });
    } catch (err) {
      let filename = req?.file?.filename;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/registrationImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (err.isJoi) return next(createError.BadRequest(err?.message));

      next(err);
    }
  },
  get: async (req, res, next) => {
    try {
      let registrationTypes = await RegistrationTypeModel.find({});

      if (!registrationTypes || registrationTypes?.length == 0) {
        throw createError?.NotFound();
      }

      res.status(200).json({
        message: "Registration types successfully retrieved",
        data: registrationTypes,
      });
    } catch (err) {
      next(err);
    }
  },
  updateRegistrationType: async (req, res, next) => {
    try {
      let { registration_type, id, couples_type } = req.body;

      if (
        !registration_type ||
        !id ||
        (registration_type?.toLowerCase() == "couples" && !couples_type)
      )
        throw createError.BadRequest("Required fields are missing");

      if (registration_type?.toLowerCase() == "single" && couples_type)
        throw createError.BadRequest("Cannot add couples type in type single");
      const registration = await RegistrationTypeModel.findById(id);

      if (!registration)
        throw createError.NotFound("Registration type not found");

      let validatedData = {
        registration_type: registration_type,
        couples_type: couples_type,
      };

      let result = await RegistrationTypeSchema.validateAsync(validatedData);

      let filename = req?.file?.filename;

      let registrationTypeData = {
        registration_type: result?.registration_type,
        couples_type: result?.couples_type,
        image_path: filename ? filename : registration?.image_path,
      };

      if (!registration) {
        throw createError.NotFound("Registration Type Not Found");
      }

      const updatedRegistrationType =
        await RegistrationTypeModel.findByIdAndUpdate(
          id,
          registrationTypeData,
          {
            new: true,
          }
        );

      if (!updatedRegistrationType)
        throw createError.InternalServerError(
          "Failed to update registration type"
        );

      let oldPic = registration.image_path;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/registrationImages/${oldPic}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      res.status(200).json({
        message: "Registration type updated successfully",
        data: updatedRegistrationType,
      });
    } catch (err) {
      let filename = req?.file?.filename;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/registrationImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (err.isJoi) return next(createError?.BadRequest());

      next(err);
    }
  },
  deleteRegistrationType: async (req, res, next) => {
    let id = req?.params?.id;

    try {
      if (!id) throw createError.BadRequest("Required fields are missing");

      let deletedType = await RegistrationTypeModel.findByIdAndDelete(id);

      if (!deletedType)
        throw createError.NotFound("Registration type not found");

      if (deletedType?.image_path) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/registrationImages/${deletedType?.image_path}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      res.status(200).json({
        message: "Successfully deleted registration type",
        data: deletedType,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = RegistrationTypeController;
