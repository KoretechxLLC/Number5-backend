const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  event_name: {
    type: String,
    required: true
  },
  event_start_time: {
    type: String,
    required: true
  },
  event_end_time: {
    type: String,
    required: true
  },
  event_date: {
    type: Date,
    required: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  event_description: {
    type: String,
    required: true
  },
  event_sop: {
    type: String,
    required: true
  },
  event_ticket_price: {
    type: Number,
    required: true
  },
  event_pic: {
    type: String,
    required : true
  }
});

const EventModel = mongoose.model('Event', eventSchema);

module.exports = EventModel;
