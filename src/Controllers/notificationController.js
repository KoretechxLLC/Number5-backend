const { getAccessToken } = require("../../helper/get_access_token");
const axios = require("axios");
const createError = require("http-errors");

const notificationController = {
  send: async (req, res, next) => {
    try {
      let { title, body, usertoken, topic } = req.body;

      if (!title || !body)
        throw createError.BadRequest("Required fields are missing");

      let token = await getAccessToken();

      if (!token) throw createError.InternalServerError();

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      let message;
      if (usertoken) {
        message = {
          message: {
            token: usertoken,
            notification: {
              title: "Test Title",
              body: "Test Body",
            },
          },
        };
      } else {
        message = {
          message: {
            topic: "all_devices",
            notification: {
              title: title,
              body: body,
            },
          },
        };
      }

      let response = await axios.post(
        "https://fcm.googleapis.com/v1/projects/number-5-2ec37/messages:send",
        message,
        { headers }
      );

      res.status(200).json({
        message: "Notification successfully send",
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = notificationController;
