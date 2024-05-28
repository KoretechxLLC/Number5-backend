const createError = require("http-errors");
const { TermsAndConditionsSchema } = require("../../helper/validation_schema");
const TermsAndConditionsModel = require("../Models/termsAndConditions.model");

const TermsAndConditionsController = {
  addTermsAndConditions: async (req, res, next) => {
    try {
      let { terms_and_conditions } = req.body;
      if (!terms_and_conditions) {
        throw createError.BadRequest("Required fields are missing");
      }

      let result = await TermsAndConditionsSchema.validateAsync(req.body);

      let termsAndConditions = new TermsAndConditionsModel({
        terms_and_conditions: result?.terms_and_conditions,
      });

      let data = await termsAndConditions.save();

      res.status(200).json({
        message: "Terms and Conditions Successfully Updated",
        data: data,
      });
    } catch (err) {
      if (err.isJoi) return next(createError.BadRequest(err?.message));
      next(err);
    }
  },
};

module.exports = TermsAndConditionsController;
