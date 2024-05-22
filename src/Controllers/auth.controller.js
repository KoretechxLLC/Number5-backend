const createError = require("http-errors")
const joi = require("joi")
const { authSchema, loginSchema } = require("../../helper/validation_schema")
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









    },

    login: async (req, res, next) => {
        try {
          let { membership_id, username, password } = req.body;
    
          if (!password || (!membership_id && !username))
            throw createError?.BadRequest("Required fields are missing");
    
          const result = await loginSchema.validateAsync(req.body);
    
          let user;
    
          if (result?.membership_id) {
            user = await UserModel.findOne({ membership_id: membership_id });
          } else if (result?.username) {
            user = await UserModel.findOne({ username: username });
          }
    
          if (!user || user?.length == 0) {
            throw createError.NotFound("User Not Found");
          }
    
    
          let checkPassword = await user.isValidPassword(result?.password);
    
    
          if (!checkPassword) {
            throw createError.Unauthorized("Invalid Username/Password");
          }
    
          if (user?.user_status?.toLowerCase() == "pending") {
            throw createError?.Unauthorized("Your Profile is in pending");
          }
    
          if (user?.user_status?.toLowerCase() == "blocked") {
            throw createError?.Unauthorized("Your Profile has been blocked");
          }
    
          const accessToken = await signAccessToken(user.id);
    
          const refreshToken = await signRefreshToken(user.id);
    
          let dataToSend = {
            registration_type: user?.registration_type,
            couples_type: user?.couples_type,
            event_fee: user?.event_fee,
            gender: user?.gender,
            full_name: user?.full_name,
            date_of_birth: user?.date_of_birth,
            email: user?.email,
            phone_number: user?.phone_number,
            address: user?.address,
            occupation: user?.occupation,
            height: user?.height,
            weight: user?.weight,
            id: user?.id,
            sexuality: user?.sexuality,
            life_style: user?.life_style,
            wanted_experience: user?.wanted_experience,
            user_quality: user?.user_quality,
            user_status : user?.user_status,
            is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
          };
    
          res.status(200).json({
            message: "User Successfully Logged In",
            data: dataToSend,
            accessToken: accessToken,
            refreshToken: refreshToken,
          });
        } catch (err) {
          if (err.isJoi) next(createError?.BadRequest("Invalid Fields"));
    
          next(err);
        }
      },
    


}


module.exports = AuthController