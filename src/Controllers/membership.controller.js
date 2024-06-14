const createError = require("http-errors");
const path = require("path");
const fs = require("fs");
const MembershipModel = require("../Models/membership.model");
const { MembershipSchema } = require("../../helper/validation_schema");

const MembershipController = {
  add_membersip: async (req, res, next) => {
    let membershipData = req.body;
    let filename = req?.file?.filename;

    try {
      let {
        package_name,
        duration_type,
        benefits,
        scope,
        gender_type,
        additional_details,
        scope_heading,
        single_membership_amount,
        couple_membership_amount,
        booking_type,
        default_membership,
        total_passes,
        total_guests_allowed,
      } = membershipData;

      if (
        !package_name ||
        !duration_type ||
        !benefits ||
        benefits.length == 0 ||
        !booking_type ||
        booking_type.length == 0 ||
        !gender_type
      )
        throw createError.BadRequest("Required fields are missing");

      if (!filename) throw createError.BadRequest("Badge Image is missing");

      membershipData.badge_image_path = filename;

      let ismembership_exists = await MembershipModel.findOne({
        package_name: package_name,
      });

      if (ismembership_exists)
        throw createError.Conflict("Package Name Already Exists");

      let result = await MembershipSchema.validateAsync(membershipData);

      let new_membership_Package = await new MembershipModel(result);

      const membershipPackage = await new_membership_Package.save();

      res.status(200).json({
        message: "Membership Package Successfully Created",
        data: membershipPackage,
      });
    } catch (err) {
      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/badgeImages/${filename}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (err.isJoi) return next(createError.BadRequest("Invalid Field Error"));

      next(err);
    }
  },
  get: async (req, res, next) => {
    try {
      let memberships = await MembershipModel.find({});

      res.status(200).json({
        message: "Successfully get all memberships",
        data: memberships && memberships.length > 0 ? memberships : [],
      });
    } catch (err) {
      next(err);
    }
  },
  update_membersip: async (req, res, next) => {
    let membershipData = req.body;
    let filename = req?.file?.filename;

    try {
      let {
        package_name,
        duration_type,
        benefits,
        scope,
        gender_type,
        additional_details,
        scope_heading,
        single_membership_amount,
        couple_membership_amount,
        badge_image_path,
        booking_type,
        default_membership,
        total_passes,
        total_guests_allowed,
        id,
      } = membershipData;

      if (!package_name || !duration_type)
        throw createError.BadRequest("Required fields are missing");

      if (membershipData?.gender_type) {
        membershipData.gender_type = JSON.parse(membershipData.gender_type);
      }

      if (membershipData?.benefits) {
        membershipData.benefits = JSON.parse(membershipData.benefits);
      }

      if (membershipData?.scope) {
        membershipData.scope = JSON.parse(membershipData.scope);
      }

      if (!id) throw createError.BadRequest("User Id is missing");

      if (filename) {
        membershipData.badge_image_path = filename;
      }
      let membership = await MembershipModel.findById(id);

      if (!membership)
        throw createError.NotFound("Membership Package Not Found");

      let ismembership_exists = await MembershipModel.findOne({
        package_name: package_name,
        _id: { $ne: id },
      });

      if (ismembership_exists)
        throw createError.Conflict("Package Name Already Exists");

      const updatedMembershipPackage = await MembershipModel.findByIdAndUpdate(
        id,
        membershipData,
        {
          new: true,
        }
      );

      if (membership?.badge_image_path && filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/badgeImages/${membership?.badge_image_path}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }
      res.status(200).json({
        message: "Membership Package Successfully Updated",
        data: updatedMembershipPackage,
      });
    } catch (err) {
      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/badgeImages/${filename}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (err.isJoi) return next(createError.BadRequest("Invalid Field Error"));

      next(err);
    }
  },
};

module.exports = MembershipController;
