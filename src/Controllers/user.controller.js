const createError = require("http-errors");
const UserModel = require("../Models/user.model");

const UserController = {
  get: async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw createError.BadRequest();
      }

      let user = await UserModel.findById(id)

      console.log(user,"user")

      if(!user || user?.length == 0){

            throw createError.NotFound("User Not Found")
        
      }
     
      let dataToSend = {
        registration_type: user?.registration_type,
        couples_type: user?.couples_type,
        registration_fee: user?.registration_fee,
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
        user_status: user?.user_status,
        is_fee_paid: user?.is_fee_paid,
        profile_pic : user?.profile_pic,
        is_agree_terms_and_conditions: user?.is_agree_terms_and_conditions,
        role: user?.role,
      };

      res.status(200).json({
        message : "User data successfully retrived",
        data : dataToSend
      })


    } catch (err) {
      next(err);
    }
  },
};



module.exports = UserController