const createError = require("http-errors");
const { EventSchema } = require("../../helper/validation_schema");
const EventModel = require("../Models/event.model");
const path = require("path");
const fs = require("fs");

const EventController = {
  createEvent: async (req, res, next) => {
    try {
      let eventData = req.body;

      let {
        event_name,
        event_start_time,
        event_end_time,
        event_date,
        event_ticket_price,
        latitude,
        longitude,
        event_description,
        event_sop,
      } = req.body;

      if (
        !event_name ||
        !event_start_time ||
        !event_end_time ||
        !event_date ||
        !event_ticket_price ||
        !latitude ||
        !longitude ||
        !event_description ||
        !event_sop
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      let filename = req?.file?.filename;

      if (!filename) throw createError.BadRequest("Event Pic is missing");

      const eventDate = new Date(event_date);

      const currentDate = new Date();
      if (eventDate < currentDate) {
        throw createError.BadRequest("Event date cannot be in the past");
      }

      eventData.event_date = eventDate;

      eventData.event_pic = filename;

      let result = await EventSchema.validateAsync(eventData);

      let newEvent = new EventModel(result);

      const event = await newEvent.save();

      res.status(200).json({
        message: "Event Successfully Created",
        data: event,
      });
    } catch (err) {
      let filename = req?.file?.filename;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../eventImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
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

      let events = await EventModel.find({ event_date: { $gte: currentDate } });

      if (!events || events?.length == 0)
        throw createError.NotFound("Events not found");

      res.status(200).json({
        message: "Retrieved Events Successfully",
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
        events = await EventModel.find(query);
      } else {
        let skip = (page - 1) * size;
        let limit = size;
        events = await EventModel.find(query).skip(skip).limit(limit);
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
        event_ticket_price,
        latitude,
        longitude,
        event_description,
        event_sop,
        id,
      } = req.body;

      if (
        !event_name ||
        !event_start_time ||
        !event_end_time ||
        !event_date ||
        !event_ticket_price ||
        !latitude ||
        !longitude ||
        !event_description ||
        !event_sop ||
        !id
      ) {
        throw createError.BadRequest("Required fields are missing");
      }

      let event = await EventModel.findById(id);

      if (!event) throw createError.NotFound("Event Not Found");

      const eventDate = new Date(event_date);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (eventDate < currentDate) {
        throw createError.BadRequest("Event date cannot be in the past");
      }

      let filename = req?.file?.filename;

      if (filename) {
        eventData.event_pic = filename;
      } else {
        eventData.event_pic = event.event_pic;
      }

      let result = await EventSchema.validateAsync(eventData);

      let oldPic = event.event_pic;

      const updatedEvent = await EventModel.findByIdAndUpdate(id, result, {
        new: true,
      });

      if (!updatedEvent)
        throw createError.InternalServerError("Failed to update event details");

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../eventImages/${oldPic}`
        );

        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
        });
      }

      res.status(200).json({
        message: "Event Details updated successfully",
        data: updatedEvent,
      });
    } catch (err) {
      let filename = req?.file?.filename;

      if (filename) {
        const destinationFolder = path.join(
          __dirname,
          `../../eventImages/${filename}`
        );
        fs.unlink(destinationFolder, (err) => {
          if (err) {
            console.error("error deleting picture");
          }
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
          `../../eventImages/${event.event_pic}`
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
};

module.exports = EventController;
