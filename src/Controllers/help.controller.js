const createError = require("http-errors");
const { messageSchema } = require("../../helper/validation_schema");
const UserModel = require("../Models/user.model");
const HelpModel = require("../Models/message.model");
const { sendEmail } = require("../../helper/send_email");

const HelpController = {
  sendMessage: async (req, res, next) => {
    try {
      let { subject, message, id } = req.body;

      if (!subject || !message || !id)
        throw createError.BadRequest("Required fields are missing");

      const result = await messageSchema.validateAsync(req.body);

      const user = await UserModel.findById(id);

      if (!user) {
        throw createError.NotFound("User Not Found");
      }

      let userMessage = new HelpModel({
        subject: result?.subject,
        message: result?.message,
        first_name: user?.first_name,
        last_name: user?.last_name,
        email: user?.email,
        phone_number: user?.phone_number,
        address: user?.address,
        username: user?.username,
        membership_id: user?.membership_id,
        userId: result?.id,
      });

      let myMessage = await userMessage.save();

      res.status(200).json({
        message: "Message has been successfully send",
        data: myMessage,
      });
    } catch (err) {
      if (err.isJoi) return next(createError.BadRequest(err?.message));
      next(err);
    }
  },
  reply_message: async (req, res, next) => {
    try {
      let { subject, message, email, id } = req.body;

      if (!subject || !message || !email || !id)
        throw createError.BadRequest("Required fields are missing");

      await sendEmail(email, subject, message);

      let helpReply = await HelpModel.findByIdAndUpdate(
        id,
        {
          $set: {
            status: "replied",
            admin_message: message,
            admin_subject: subject,
          },
        },
        { new: true }
      );

      res.status(200).json({
        message: "Email has been successfully send",
        data: helpReply,
      });
    } catch (err) {
      next(err);
    }
  },
  get_message: async (req, res, next) => {
    try {
      let page = parseInt(req.params.page);
      let size = parseInt(req.params.size);

      let query = {};

      let helpers;

      if (!page || !size || page <= 0 || size <= 0) {
        // Retrieve all data
        helpers = await HelpModel.find(query);
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        helpers = await HelpModel.find(query).skip(skip).limit(limit);
      }

      if (!helpers || helpers.length == 0)
        throw createError.NotFound("Data Not Found");

      res.status(200).json({
        message: "help Data Retrieved Successfully",
        data: helpers,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = HelpController;
