



const mongoose = require("mongoose")




const GuestDetailsSchema = new mongoose.Schema({
    id_card_path: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
    }
}, { _id: false });


const BookingSchema = new mongoose.Schema({

    user_data : {
        type : mongoose.Schema.Types.Mixed,
        required : true
    },
    userId : {
        type : String,
        required : true
    },
    eventId : {
        type : String,
        required : true
    },
    event_data : {
        type : mongoose.Schema.Types.Mixed,
        required : true
    },
    selected_booking_type : {
        type : {},
        required : true
    },
    is_event_attended : {
        type : Boolean,
    },
    no_of_guests : {
        type : Number
    },
    guest_details : {
        type : [GuestDetailsSchema],
    },
    arrival_time : {
        type : String,
        required : true
    },
    payment_option : {
        type : String,
        required : true
    },
    is_fee_paid : {
        type : Boolean,
        required : true
    },
    is_event_attended : {
        type : Boolean,
        default : false
    },
    created_at : {
        type : Date,
        default : Date.now
    },
    updated_at : {
        type : Date,
        default : Date.now
    },
    cancellation_date : {
        type : Date,
    },
    attended_time : {
        type : Date,
    },
    status : {
        type : String,
        required : true
    },
    booking_status : {
        type : String,
        required : true
    },
    total_amount : {
        type : Number,
        required : true
    }
})

const BookingModel = mongoose.model("Bookings", BookingSchema);

module.exports = BookingModel;
