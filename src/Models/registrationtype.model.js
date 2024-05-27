const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const RegistrationTypeSchema = new Schema({
  registration_type: {
    type: String,
    required: true,
  },
  couples_type: {
    type: String,
  },
image_path : {
    type : String,
    required : true
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

RegistrationTypeSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

const RegistrationTypeModel = mongoose.model("registrationTypes", RegistrationTypeSchema);

module.exports = RegistrationTypeModel;
