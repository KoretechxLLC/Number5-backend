const { number } = require("joi");
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const membershipHistorySchema = new mongoose.Schema({
  package_name: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  membership_id: {
    type: String,
    required: true,
  },
  duration_type: {
    type: String,
    required: true,
  },
  membership_duration_days: {
    type: Number,
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
  purchase_date: {
    type: Date,
  },
  expiry_date: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  default_membership: {
    type: Boolean,
    default: false,
  },
});

const MembershipHistoryModel = mongoose.model(
  "membershipHistory",
  membershipHistorySchema
);

module.exports = MembershipHistoryModel;
