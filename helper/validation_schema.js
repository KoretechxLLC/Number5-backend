const joi = require("joi");


const authSchema = joi.object({

    registration_type : joi.string()?.lowercase().required(),
    couples_type:  joi.string().lowercase().required(),
    event_fee : joi.number().required(),
    profile_pic : joi.string().required(),
    is_fee_paid: joi.boolean(),
    gender: joi.string().required(),
    date_of_birth : joi.string(),
    phone_number: joi.string().regex(/^(?:\+?44|0)7(?:\d{3}|\d{4})\d{6}$/),
    full_name: joi.string().required(),
    address : joi?.string().required(),
    occupation:joi?.string().required(),
    height:joi?.number().required(),
    weight:joi?.number().required(),
    sexuality : joi.string().required(),
    life_style : joi.string().required(),
    wanted_experience : joi.string().required(),
    user_quality : joi.string().required(),
    is_agree_terms_and_conditions : joi.boolean().required(),
    user_status : joi.string(),
    membership_id : joi.string(),
    username : joi.string().alphanum(),   
    email: joi.string().email().lowercase().required(),
    password: joi.string().min(8),
})


const loginSchema = joi.object({
    password: joi.string().required(),
    membership_id: joi.string(),
    username: joi.string()
}).or('membership_id', 'username').required();


const approvedUserSchema = joi.object({
    email: joi.string().email().lowercase().required(),
})




module.exports = {
    authSchema : authSchema,
    loginSchema: loginSchema,
    approvedUserSchema : approvedUserSchema
}