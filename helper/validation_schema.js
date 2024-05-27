const joi = require("joi");

const authSchema = joi.object({
  registration_type: joi.string()?.lowercase().required(),
  couples_type: joi.string().lowercase(),
  profile_pic: joi.string().required(),
  gender: joi.string().required(),
  date_of_birth: joi.string(),
  phone_number: joi.string().regex(/^(?:\+?44|0)7(?:\d{3}|\d{4})\d{6}$/),
  full_name: joi.string().required(),
  address: joi?.string().required(),
  occupation: joi?.string().required(),
  height: joi?.number().required(),
  weight: joi?.number().required(),
  sexuality: joi.string().required(),
  life_style: joi.string().required(),
  wanted_experience: joi.string().required(),
  user_quality: joi.string().required(),
  is_agree_terms_and_conditions: joi.boolean().required(),
  user_status: joi.string(),
  id: joi.string(),
  email: joi.string().email().lowercase().required(),
  partner_details: joi.when('registration_type', {
    is: joi.string().valid('couples'),
    then: joi.object().required(),
    otherwise: joi.object()
  })
});

const partnerSchema = joi.object({
  registration_type: joi.string()?.lowercase().required(),
  couples_type: joi.string().lowercase().required(),
  profile_pic: joi.string().required(),
  gender: joi.string().required(),
  date_of_birth: joi.string(),
  phone_number: joi.string().regex(/^(?:\+?44|0)7(?:\d{3}|\d{4})\d{6}$/),
  full_name: joi.string().required(),
  address: joi?.string().required(),
  occupation: joi?.string().required(),
  height: joi?.number().required(),
  weight: joi?.number().required(),
  sexuality: joi.string().required(),
  life_style: joi.string().required(),
  wanted_experience: joi.string().required(),
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
  registration_type : joi?.string()?.lowercase()?.required(),
  couples_type: joi.string().lowercase().when('registration_type', {
    is: 'couple',
    then: joi.string().lowercase().required(),
    otherwise: joi.string().lowercase().optional()
  }),
  image_path : joi.string()
})

module.exports = {
  authSchema: authSchema,
  partnerSchema: partnerSchema,
  loginSchema: loginSchema,
  approvedUserSchema: approvedUserSchema,
  changePasswordSchema: changePasswordSchema,
  messageSchema: messageSchema,
  TermsAndConditionsSchema: TermsAndConditionsSchema,
  RegistrationTypeSchema : RegistrationTypeSchema
};
