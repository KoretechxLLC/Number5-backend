const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  event_name: {
    type: String,
    required: true,
    unique: true,
  },
  event_start_time: {
    type: String,
    required: true,
  },
  event_end_time: {
    type: String,
    required: true,
  },
  event_date: {
    type: Date,
    required: true,
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  event_description: {
    type: String,
    required: true,
  },
  event_sop: {
    type: [],
    required: true,
  },
  event_regular_single_price: {
    type: Number,
    // required: true,
  },
  event_regular_couple_price: {
    type: Number,
    // required: true,
  },
  event_premium_single_price: {
    type: Number,
    // required: true,
  },
  event_premium_couple_price: {
    type: Number,
    // required: true,
  },
  todaySpecial : {
    type : [],
  },
  event_pic: {
    type: String,
    required: true,
  },
  qrimage_path: {
    type: String,
    required: true,
  },
});

const EventModel = mongoose.model("Event", eventSchema);

module.exports = EventModel;
