const joi = require("joi");

const authSchema = joi.object({
  registration_type: joi.string()?.lowercase().required(),
  couples_type: joi.string().lowercase(),
  profile_pic: joi.string().required(),
  gender: joi.string().required(),
  date_of_birth: joi.string(),
  phone_number: joi.string(),
  first_name: joi.string().required(),
  last_name: joi.string().required(),
  address: joi?.string().required(),
  country: joi?.string().required(),
  city: joi?.string().required(),
  postalCode: joi?.string().required(),
  occupation: joi?.string().required(),
  ethnicity: joi?.string().required(),
  hobbies: joi?.string().required(),
  interest: joi?.string().required(),
  height: joi?.number().required(),
  weight: joi?.number().required(),
  sexuality: joi.string().required(),
  life_style: joi.string().required(),
  wanted_experience: joi.string().required(),
  user_quality: joi.string().required(),
  is_agree_terms_and_conditions: joi.boolean().required(),
  user_status: joi.string(),
  id: joi.string(),
  token: joi.string(),
  membership: joi.object(),
  push_notification_option: joi.boolean(),
  event_vistis: joi.number(),
  email: joi.string().email().lowercase().required(),
  partner_details: joi.when("registration_type", {
    is: joi.string().valid("couples"),
    then: joi.object().required(),
    otherwise: joi.object(),
  }),
});

const updateUserSchema = joi.object({
  registration_type: joi.string()?.lowercase().required(),
  couples_type: joi.string().lowercase(),
  profile_pic: joi.string().required(),
  gender: joi.string().required(),
  date_of_birth: joi.string(),
  phone_number: joi.string(),
  first_name: joi.string().required(),
  last_name: joi.string().required(),
  address: joi?.string().required(),
  country: joi?.string(),
  city: joi?.string(),
  postalCode: joi?.string(),
  occupation: joi?.string().required(),
  ethnicity: joi?.string(),
  hobbies: joi?.string(),
  interest: joi?.string(),
  height: joi?.number().required(),
  weight: joi?.number().required(),
  sexuality: joi.string().required(),
  life_style: joi.string().required(),
  wanted_experience: joi.string().required(),
  user_quality: joi.string().required(),
  is_agree_terms_and_conditions: joi.boolean().required(),
  user_status: joi.string(),
  event_vistis: joi.number(),
  push_notification_option: joi.boolean(),
  token: joi.string(),
  id: joi.string().required(),
  email: joi.string().email().lowercase().required(),
});

const partnerSchema = joi.object({
  registration_type: joi.string()?.lowercase().required(),
  couples_type: joi.string().lowercase().required(),
  profile_pic: joi.string().required(),
  gender: joi.string().required(),
  date_of_birth: joi.string(),
  phone_number: joi.string(),
  first_name: joi.string().required(),
  last_name: joi.string().required(),
  address: joi?.string().required(),
  country: joi?.string().required(),
  city: joi?.string().required(),
  postalCode: joi?.string().required(),
  ethnicity: joi?.string().required(),
  hobbies: joi?.string().required(),
  interest: joi?.string().required(),
  token: joi.string(),
  push_notification_option: joi.boolean(),
  occupation: joi?.string().required(),
  height: joi?.number().required(),
  weight: joi?.number().required(),
  membership: joi?.object(),
  sexuality: joi.string().required(),
  life_style: joi.string().required(),
  wanted_experience: joi.string().required(),
  event_vistis: joi.number(),
  user_quality: joi.string().required(),
  is_agree_terms_and_conditions: joi.boolean().required(),
  user_status: joi.string(),
  id: joi.string(),
  email: joi.string().email().lowercase().required(),
});

const loginSchema = joi
  .object({
    password: joi.string().required(),
    membership_id: joi.string(),
    username: joi.string(),
  })
  .or("membership_id", "username")
  .required();

const approvedUserSchema = joi.object({
  email: joi.string().email().lowercase().required(),
});

const changePasswordSchema = joi.object({
  email: joi.string().email().lowercase().required(),
  password: joi.string().required(),
  confirm_password: joi.ref("password"),
});

const messageSchema = joi.object({
  subject: joi.string().min(5).max(100).required(),
  message: joi.string().min(10).max(500).required(),
  id: joi.string().required(),
});

const TermsAndConditionsSchema = joi.object({
  terms_and_conditions: joi.string().required(),
});

const RegistrationTypeSchema = joi.object({
  registration_type: joi?.string()?.lowercase()?.required(),
  couples_type: joi.string().lowercase().when("registration_type", {
    is: "couple",
    then: joi.string().lowercase().required(),
    otherwise: joi.string().lowercase().optional(),
  }),
  image_path: joi.string(),
});

const EventSchema = joi.object({
  event_name: joi.string().required(),
  event_start_time: joi.string().required(),
  event_end_time: joi.string().required(),
  event_date: joi.date().required(),
  latitude: joi.number().required(),
  longitude: joi.number().required(),
  event_description: joi.string().max(1000).required(),
  event_sop: joi.array().required(),
  event_regular_single_price: joi.number().required(),
  event_regular_couple_price: joi.number().required(),
  event_premium_single_price: joi.number().required(),
  event_premium_couple_price: joi.number().required(),
  event_pic: joi.string().required(),
  id: joi.string(),
  todaySpecial: joi.array(),
});

const MembershipSchema = joi.object({
  package_name: joi.string().required(),
  duration_type: joi.string().required(),
  badge_image_path: joi.string().required(),
  benefits: joi.array().required(),
  booking_type: joi.array().min(1).required(),
  scope: joi.array(),
  gender_type: joi.array().required(),
  additional_details: joi.string(),
  scope_heading: joi.string(),
  single_membership_amount: joi.number().required(),
  couple_membership_amount: joi.number().required(),
  total_passes: joi.number(),
  default_membership: joi.boolean(),
  total_guests_allowed: joi.number(),

  id: joi.string(),
});

module.exports = {
  authSchema: authSchema,
  partnerSchema: partnerSchema,
  loginSchema: loginSchema,
  approvedUserSchema: approvedUserSchema,
  updateUserSchema: updateUserSchema,
  changePasswordSchema: changePasswordSchema,
  messageSchema: messageSchema,
  TermsAndConditionsSchema: TermsAndConditionsSchema,
  RegistrationTypeSchema: RegistrationTypeSchema,
  EventSchema: EventSchema,
  MembershipSchema: MembershipSchema,
};
