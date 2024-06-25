const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const UserSchema = new Schema({
  registration_type: {
    type: String,
    required: true,
  },
  couples_type: {
    type: String,
  },
  profile_pic: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  full_name: {
    type: String,
    required: true,
  },
  date_of_birth: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  occupation: {
    type: String,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  sexuality: {
    type: String,
    required: true,
  },
  life_style: {
    type: String,
    required: true,
  },
  wanted_experience: {
    type: String,
    required: true,
  },

  user_quality: {
    type: String,
    required: true,
  },

  is_agree_terms_and_conditions: {
    type: Boolean,
    required: true,
  },
  user_status: {
    type: String,
    default: "pending",
  },
  membership_id: {
    type: String,
  },
  membership : {
    type : {},
  },
  username: {
    type: String,
  },
  password: {
    type: String,
  },
  approved_date: {
    type: Date,
  },
  account_created_by : {
    type : String,
  },
  role: {
    type: String,
    default: "user",
  },
  card_number : {
    type : Number,
  },
  partner_ref : {
    type : String,
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

UserSchema.pre("save", function (next) {
  this.updated_at = new Date();
  next();
});

UserSchema.pre("save", async function (next) {
  if (this?.password) {
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(this.password, salt);
    this.password = hashPassword;
    next();
    
  } else {
    next();
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    const isMatched = await bcrypt.compare(password, this.password);
    return isMatched;
  } catch (error) {
    throw error;
  }
};

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
