const UserModel = require("../src/Models/user.model");
const createError = require("http-errors");

const verifyAdminRole = async (req, res, next) => {
    try {

        let payload = req.payload;
        let userId = payload.aud;

        let user = await UserModel.findById(userId);

        if (!user) {
            return next(createError.Unauthorized("Unauthorized"));
        }

        if (user.role && user.role.toLowerCase() === "admin") {
            
            return next();
        } else {
            return next(createError.Unauthorized("Unauthorized"));
        }
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    verifyAdminRole: verifyAdminRole
};
