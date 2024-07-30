const createError = require("http-errors");
const { EventSchema } = require("../../helper/validation_schema");
const EventModel = require("../Models/event.model");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

const EventController = {
  createEvent: async (req, res, next) => {
    try {
      let eventData = req.body;

      let {
        event_name,
        event_start_time,
        event_end_time,
        event_date,
        event_regular_single_price,
        event_regular_couple_price,
        event_premium_single_price,
        event_premium_couple_price,
        latitude,
        longitude,
        event_description,
        event_sop,
        event_couple_ticket_price,
        todaySpecial,
      } = req.body;

      if (
        !event_name ||
        !event_start_time ||
        !event_end_time ||
        !event_date ||
        !event_regular_single_price ||
        !event_regular_couple_price ||
        !event_premium_single_price ||
        !event_premium_couple_price ||
        !latitude ||
        !longitude ||
        !event_description ||
        !event_sop
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      let filename = req.files.eventImage?.[0]?.filename;
      let todaySpecialFiles = req?.files?.todayspecial;

      if (eventData?.todaySpecial) {
        eventData.todaySpecial = JSON.parse(eventData.todaySpecial);
      }

      if (todaySpecial) {
        todaySpecial = JSON.parse(todaySpecial);
      }

      if (!filename) throw createError.BadRequest("Event Pic is missing");

      const eventDate = new Date(event_date);

      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (eventDate < currentDate) {
        throw createError.BadRequest("Event date cannot be in the past");
      }

      let eventExists = await EventModel.findOne({ event_name: event_name });

      if (eventExists) throw createError.Conflict("Event Name already exists");

      eventData.event_date = eventDate;
      eventData.event_pic = filename;

      if (eventData?.todaySpecial && eventData?.todaySpecial.length > 0) {
        eventData.todaySpecial = [];

        todaySpecialFiles.forEach((file, index) => {
          eventData.todaySpecial.push({
            description: todaySpecial[index].description,
            heading: todaySpecial[index].heading,
            image: file.filename,
          });
        });
      }

      let result = await EventSchema.validateAsync(eventData);

      const eventDetailsString = JSON.stringify(result);

      const destinationFolder = path.join(
        __dirname,
        "../../public/eventQrImages/"
      );
      const filePath = path.join(destinationFolder, `${result.event_name}.png`);

      if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder);
      }

      QRCode.toFile(
        filePath,
        eventDetailsString,
        {
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        function (err) {
          if (err) {
            throw createError.InternalServerError("Failed to create qr image");
          }
        }
      );

      result.qrimage_path = `${result?.event_name}.png`;

      let newEvent = new EventModel(result);

      const event = await newEvent.save();

      res.status(200).json({
        message: "Event Successfully Created",
        data: event,
      });
    } catch (err) {
      let filename = req.files.eventImage?.[0]?.filename;
      let files = req?.files?.todayspecial;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/eventImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const destinationFolder = path.join(
            __dirname,
            `../../public/eventImages/${file.filename}`
          );
          fs.unlink(destinationFolder, (err) => {
            if (err) {
              console.error("error deleting picture");
            }
          });
        });
      }

      if (err.isJoi) return next(createError.BadRequest());

      next(err);
    }
  },
  getUpcomingEvents: async (req, res, next) => {
    try {
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      let tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);

      let events = await EventModel.find({
        event_date: {
          $gte: tomorrow,
        },
      });

      if (!events || events.length === 0) {
        throw createError.NotFound("Events not found");
      }

      res.status(200).json({
        message: "Retrieved Events Successfully",
        data: events,
      });
    } catch (err) {
      next(err);
    }
  },
  getTodayEvent: async (req, res, next) => {
    try {
      let currentDate = new Date();
      const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999));

      let events = await EventModel.find({
        event_date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      });
      if (!events || events?.length == 0)
        throw createError.NotFound("Events not found");

      res.status(200).json({
        message: "Retrieved Today Events Successfully",
        data: events,
      });
    } catch (err) {
      next(err);
    }
  },
  getEvents: async (req, res, next) => {
    try {
      let page = parseInt(req.params.page);
      let size = parseInt(req.params.size);

      let query = {};

      let events;

      if (!page || !size || page <= 0 || size <= 0) {
        // Retrieve all data
        events = await EventModel.find(query).sort({ event_date: -1 });
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        events = await EventModel.find(query).skip(skip).limit(limit).sort({ event_date: -1 });
      }

      if (!events || events.length == 0)
        throw createError.NotFound("Events Not Found");

      res.status(200).json({
        message: "Event Retrieved Successfully",
        data: events,
      });
    } catch (err) {
      next(err);
    }
  },
  updateEvent: async (req, res, next) => {
    try {
      let eventData = req.body;

      let {
        event_name,
        event_start_time,
        event_end_time,
        event_date,
        event_regular_single_price,
        event_regular_couple_price,
        event_premium_single_price,
        event_premium_couple_price,
        latitude,
        longitude,
        event_description,
        event_sop,
        todaySpecial,
        id,
      } = req.body;

      if (
        !event_name ||
        !event_start_time ||
        !event_end_time ||
        !event_date ||
        !latitude ||
        !longitude ||
        !event_description ||
        !event_sop ||
        !event_regular_single_price ||
        !event_regular_couple_price ||
        !event_premium_single_price ||
        !event_premium_couple_price ||
        !id
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      let event = await EventModel.findById(id);

      if (!event) throw createError.NotFound("Event Not Found");

      let eventExists = await EventModel.findOne({
        event_name: event_name,
        _id: { $ne: id },
      });

      if (eventExists) throw createError.Conflict("Event Name already exists");

      const eventDate = new Date(event_date);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (eventDate < currentDate) {
        throw createError.BadRequest("Event date cannot be in the past");
      }

      let filename = req.files?.eventImage?.[0]?.filename;
      let todaySpecialFiles = req?.files?.todayspecial;

      if (eventData?.todaySpecial) {
        eventData.todaySpecial = JSON.parse(eventData.todaySpecial);
      }

      if (todaySpecial) {
        todaySpecial = JSON.parse(todaySpecial);
      }

      if (filename) {
        eventData.event_pic = filename;
      } else {
        eventData.event_pic = event.event_pic;
      }

      if (
        eventData?.todaySpecial &&
        eventData?.todaySpecial.length > 0 &&
        todaySpecialFiles
      ) {
        eventData.todaySpecial = [];

        todaySpecialFiles.forEach((file, index) => {
          eventData.todaySpecial.push({
            description: todaySpecial[index].description,
            heading: todaySpecial[index].heading,
            image: file.filename,
          });
        });
      }

      let result = await EventSchema.validateAsync(eventData);

      const eventDetailsString = JSON.stringify(result);

      const destinationFolder = path.join(
        __dirname,
        "../../public/eventQrImages/"
      );

      const filePath = path.join(destinationFolder, `${result.event_name}.png`);

      if (!fs.existsSync(destinationFolder)) {
        fs.mkdirSync(destinationFolder);
      }

      QRCode.toFile(
        filePath,
        eventDetailsString,
        {
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        function (err) {
          if (err) {
            throw createError.InternalServerError("Failed to create qr image");
          }
        }
      );

      if (event.event_name !== event_name) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/eventQrImages/${event.qrimage_path}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("Error deleting picture:", err);
          }
        });
      }

      result.qrimage_path = `${result?.event_name}.png`;

      let oldPic = event.event_pic;

      const updatedEvent = await EventModel.findByIdAndUpdate(id, result, {
        new: true,
      });

      if (!updatedEvent)
        throw createError.InternalServerError("Failed to update event details");

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/eventImages/${oldPic}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (todaySpecialFiles && todaySpecialFiles.length > 0) {
        todaySpecial.forEach((file, index) => {
          const destinationFolder = path.join(
            __dirname,
            `../../public/eventImages/${file.image}`
          );
          fs.unlink(destinationFolder, (err) => {
            if (err) {
              console.error("error deleting picture");
            }
          });
        });
      }

      res.status(200).json({
        message: "Event Details updated successfully",
        data: updatedEvent,
      });
    } catch (err) {
      let filename = req.files.eventImage?.[0]?.filename;
      let files = req?.files?.todayspecial;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/eventImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const destinationFolder = path.join(
            __dirname,
            `../../public/eventImages/${file.filename}`
          );
          fs.unlink(destinationFolder, (err) => {
            if (err) {
              console.error("error deleting picture");
            }
          });
        });
      }

      if (err.isJoi) return next(createError?.BadRequest(err.message));
      next(err);
    }
  },
  delete: async (req, res, next) => {
    try {
      const id = req.params.id;
      if (!id) {
        throw createError.BadRequest("Event ID is required");
      }

      const event = await EventModel.findByIdAndDelete(id);

      if (!event) {
        throw createError.NotFound("Event not found");
      }

      if (event.event_pic) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/eventImages/${event.event_pic}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("Error deleting picture:", err);
          }
        });
      }

      if (event.todaySpecial) {
        event?.todaySpecial.forEach((file, index) => {
          const destinationFolder = path.join(
            __dirname,
            `../../public/eventImages/${file.image}`
          );
          fs.unlink(destinationFolder, (err) => {
            if (err) {
              console.error("error deleting picture");
            }
          });
        });
      }

      if (event.qrimage_path) {
        const destinationFolder = path.join(
          __dirname,
          `../../public/eventQrImages/${event.qrimage_path}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("Error deleting picture:", err);
          }
        });
      }

      res.status(200).json({
        message: "Event Successfully Deleted",
        data: event,
      });
    } catch (err) {
      next(err);
    }
  },
  getEventsCounts: async (req, res, next) => {
    try {
      let eventCount = await EventModel.countDocuments({});

      res.status(200).json({
        message: "Events count successfully retreived",
        data: eventCount,
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = EventController;
