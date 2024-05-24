const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const TermsAndConditionsSchema = new Schema({
  terms_and_conditions: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

TermsAndConditionsSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

const TermsAndConditionsModel = mongoose.model("termsAndConditions", TermsAndConditionsSchema);

module.exports = TermsAndConditionsModel;
