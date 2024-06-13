const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const membershipSchema = new mongoose.Schema({
  package_name: {
    type: String,
    required: true,
  },
  duration_type: {
    type: String,
    required: true,
  },
  badge_image_path: {
    type: String,
    required: true,
  },
  benefits: {
    type: [],
    required: true,
  },
  scope: {
    type: [],
  },
  gender_type: {
    type: [],
    required: true,
  },
  additional_details: {
    type: String,
  },
  scope_heading: {
    type: String,
  },
  male_membership_amount: {
    type: Number,
    required: true,
  },
  female_membership_amount: {
    type: Number,
    required: true,
  },
  couple_membership_amount: {
    type: Number,
    required: true,
  },
  total_passes : {
    type : Number,
  },
  total_guests_allowed : {
    type : Number,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  booking_type : {
    type : [],
    required : true
  },
  default_membership : {
    type : Boolean,
    default : false
  }
});


membershipSchema.pre("findByIdAndUpdate", function (next) {
    this.updated_at = new Date();
    next();
  });

membershipSchema.pre("save", function (next) {
    this.updated_at = new Date();
    next();
  });
  
const MembershipModel = mongoose.model("memberships", membershipSchema);

module.exports = MembershipModel;


