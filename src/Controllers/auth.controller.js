const createError = require("http-errors")
const joi = require("joi")
const { authSchema } = require("../../helper/validation_schema")
const UserModel = require("../Models/user.model")
const { signAccessToken, signRefreshToken } = require("../../helper/jwt_helper")



const AuthController = {

    registerUser: async (req, res, next) => {




        try {

            let userData = req.body

            let { registration_type, couples_type, event_fee, gender, full_name, date_of_birth, email, phone_number, address
                , occupation, height, weight, sexuality
                , life_style, wanted_experience, user_quality, is_agree_terms_and_conditions
            } = userData



            let profileImageName = req.file?.filename

            if (!profileImageName) throw createError.BadRequest("Required Fields Are Missing")

            if (!registration_type || !couples_type || !event_fee || !gender || !full_name || !date_of_birth || !email || !phone_number || !address
                || !occupation || !height || !weight || !sexuality
                || !life_style || !wanted_experience || !user_quality
            ) throw createError.BadRequest("Required Fields Are Missing")


            if( !is_agree_terms_and_conditions || is_agree_terms_and_conditions == "false") throw createError.BadRequest("must agree terms and conditions")
            

            userData.profile_pic = profileImageName

            userData.phone_number = userData?.phone_number?.split(' ').join('');

            let result = await authSchema.validateAsync(userData)

            const existingUser = await UserModel.findOne({ email: result.email })

            if (existingUser) throw createError.Conflict(`This email already exists`)

            const user = new UserModel({
                registration_type: result?.registration_type,
                couples_type: result?.couples_type,
                event_fee: result?.event_fee,
                gender: result?.gender,
                date_of_birth: result?.date_of_birth,
                phone_number: result?.phone_number,
                address: result?.address,
                occupation: result?.occupation,
                height: result?.height,
                weight: result?.weight,
                sexuality: result?.sexuality,
                life_style: result?.life_style,
                wanted_experience: result?.wanted_experience,
                user_quality: result?.user_quality,
                profile_pic: profileImageName,
                is_agree_terms_and_conditions: result?.is_agree_terms_and_conditions,
                full_name: result.full_name,
                email: result.email,
            })

            const newUser = await user.save()

            const accessToken = await signAccessToken(newUser.id)

            const refreshToken = await signRefreshToken(newUser.id)


            res.status(200).json({
                message: 'User Successfully Registered',
                data: newUser,
                accessToken: accessToken,
                refreshToken: refreshToken
            })


        } catch (err) {

            if (err.isJoi === true) {
                next(createError.BadRequest())
                return
            }
            next(err)
        }









    }


}


module.exports = AuthController