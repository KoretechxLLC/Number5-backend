const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const InpersonRegistrationSchema = new Schema({
  registration_type: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },

  first_name: {
    type: String,
    required: true,
  },
  last_name: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  profile_pic: {
    type: String,
    required: true,
  },
  id_card : {
    type : String,
    required : true
  },
  address : {
    type : String
  },
  partner_details : {
    type : {}
  },
  partner_profile_pic : {
    type : String
  },
  partner_id_card : {
    type : String
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

const InpersonRegistrationModel = mongoose.model(
  "inpersonRegistration",
  InpersonRegistrationSchema
);

module.exports = InpersonRegistrationModel;
