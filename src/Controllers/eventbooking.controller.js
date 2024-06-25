const BookingModel = require("../Models/event.booking.model");
const EventModel = require("../Models/event.model");
const UserModel = require("../Models/user.model");
const createError = require("http-errors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const puppeteer = require("puppeteer");
const {
  sendEmailWithAttachment,
  sendEmail,
} = require("../../helper/send_email");

async function generatePDF(data) {
  return new Promise(async (resolve, reject) => {
    const imagePath = path.resolve(
      __dirname,
      "../../public/images/ticketback.png"
    );

    const imageSrc = `data:image/jpeg;base64,${fs.readFileSync(imagePath, {
      encoding: "base64",
    })}`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Ticket</title>
      <style>

        html, body {
          width: 70mm;
          height: 120mm;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background-color :  #212226;
          color: white;
          display: flex;
          justify-content: center;
          align-items:center;

          }
        .ticket {
          background: rgba(0, 0, 0, 0.7);
          padding: 10px;
          border-radius: 10px;
          background-image: url(${imageSrc});
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          background-color : #212226;
          width: 60mm; /* adjusted for padding and border */
          height: 100mm; /* adjusted for padding and border */
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .ticket h1 {
          font-size: 16px;
          margin-bottom: 5px;
          color: #fff;
          text-align: center;
          padding-bottom: 5px;
        }
        .section {
          border-bottom: 1px solid #474747;
          padding: 5px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .label {
          font-size: 10px;
          font-weight: 500;
        }
        .value {
          font-size: 10px;
          font-weight: 400;
          color: #FFD700;
        }
        .note {
          font-size: 8px;
          text-align: center;
          color: #FFD700;
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <h1>Event Ticket</h1>
        <div class="section">
          <span class="label">Name:</span>
          <span class="value">${data.username}</span>
        </div>
        <div class="section">
          <span class="label">Membership Type:</span>
          <span class="value">${data.membership_type}</span>
        </div>
           <div class="section">
          <span class="label">Ticket Type:</span>
          <span class="value">${data.ticket_type}</span>
        </div>
        
        <div class="section">
          <span class="label">Event Name:</span>
          <span class="value">${data.event_name}</span>
        </div>

        <div class="section">
          <span class="label">Date:</span>
          <span class="value">${data.event_date}</span>
        </div>
        <div class="section">
          <span class="label">Event Time:</span>
          <span class="value">${data.event_start_time}</span>
        </div>
        <div class="section">
          <span class="label">No. of guests:</span>
          <span class="value">${data.no_of_guests}</span>
        </div>
        <div class="section">
          <span class="label">Amount:</span>
          <span class="value">£${data.amount}</span>
        </div>
      </div>
    </body>
    </html>`;

    const sanitizedUsername = data.username.replace(/\s/g, "");
    const sanitizedEventName = data.event_name.replace(/\s/g, "");

    const pdfPath =
      path.join(__dirname, "../../public/PDF/") +
      `ticket${sanitizedUsername}${sanitizedEventName}.pdf`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({
      path: pdfPath,
      width: "70mm",
      height: "120mm",
      printBackground: true,
    });
    await browser.close();
    resolve(pdfPath);
  });
}

const EventBookingController = {
  post: async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    let files = req.files;

    let pdfPath;

    try {
      let {
        user_id,
        event_id,
        selected_booking_type,
        no_of_guests,
        guest_details,
        arrival_time,
        payment_option,
        amount,
      } = req.body;

      if (guest_details) {
        guest_details = JSON.parse(guest_details);
      }

      if (selected_booking_type) {
        selected_booking_type = JSON.parse(selected_booking_type);
      }

      if (!user_id) throw createError.BadRequest("User Id is missing");

      let user = await UserModel.findById(user_id).session(session);
      if (!user) throw createError.NotFound("User Not Found");

      if (!event_id) throw createError.BadRequest("Event id is missing");

      let event = await EventModel.findById(event_id).session(session);
      if (!event) throw createError.NotFound("Event Not Found");

      let eventDate = new Date(event?.event_date);
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate > eventDate)
        throw createError.BadRequest("This Event has been expired");

      if (!arrival_time)
        throw createError.BadRequest("Arrival Time is missing");

      if (!amount) throw createError.BadRequest("Amount is missing");

      if (
        Number(no_of_guests) > 0 &&
        guest_details.length !== Number(no_of_guests)
      ) {
        throw createError.BadRequest("Guest details are missing");
      }

      if (!selected_booking_type)
        throw createError.BadRequest("Booking type is missing");

      if (!payment_option)
        throw createError.BadRequest("Payment Option is missing");

      let checkBookings = await BookingModel.find({
        eventId: event_id,
        userId: user_id,
        booking_status: "inprocess",
      });

      if (checkBookings && checkBookings.length > 0)
        throw createError.BadRequest("You have already booked this event");

      if (files && files.length > 0) {
        guest_details = guest_details.map((e, i) => {
          return {
            ...e,
            id_card_path: files[i].filename,
          };
        });
      }

      if (
        selected_booking_type?.membership == user.membership.package_name &&
        selected_booking_type?.membership !== "Pay as you attend"
      ) {
        let guest_allowed = user.membership.total_guests_allowed;
        let guest_attended = user.membership.guestAttended;

        let remainingGuestInvitation = guest_allowed - guest_attended;

        if (no_of_guests > remainingGuestInvitation) {
          throw createError.BadRequest(
            `Your remaining guests invitation limit is ${remainingGuestInvitation}`
          );
        }
      }

      if (
        selected_booking_type?.membership == "Pay as you attend" &&
        Number(no_of_guests) > 0
      ) {
        throw createError.BadRequest(
          "Guests invitation is not allowed in this membership"
        );
      }
      if (
        selected_booking_type?.membership.toLowerCase() ==
        user.membership.package_name.toLowerCase()
      ) {
        let bookings = await BookingModel.find({
          userId: user_id,
          booking_status: "inprocess",
        });

        if (bookings && bookings.length > 0) {
          let currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);

          let onwardBookings = bookings.filter((e) => {
            let eventData = e.event_data;
            let eventDate = new Date(eventData?.event_date);
            return eventDate > currentDate;
          });

          if (onwardBookings.length >= user.membership?.remainingVisits) {
            throw createError.NotAcceptable(
              "You cannot book event more than your remaining passes"
            );
          }
        }
      }

      let bookingData = {
        user_data: user,
        userId: user_id,
        eventId: event_id,
        event_data: event,
        selected_booking_type,
        no_of_guests,
        guest_details,
        arrival_time,
        payment_option,
        is_fee_paid: false,
        is_event_attended: false,
        status: "booked",
        booking_status: "inprocess",
        total_amount: amount,
      };

      let booking = await BookingModel.create([bookingData], { session });

      let dataToSend = {
        username: user.full_name,
        membership_type: user.membership.package_name,
        event_date: new Date(event.event_date).toLocaleDateString(),
        event_start_time: event.event_start_time,
        ticket_type: selected_booking_type?.type,
        no_of_guests: no_of_guests,
        event_name: event?.event_name,
        amount: amount,
      };

      let guestAttended = user.membership.guestAttended;

      user.membership.guestAttended =
        Number(user?.membership.guestAttended) + Number(no_of_guests);
      user.markModified("membership");
      await user.save({ session });

      pdfPath = await generatePDF(dataToSend);

      if (pdfPath) {
        let subject = "Event Ticket";
        let message = "This is the event ticket";

        guest_details &&
          guest_details?.length > 0 &&
          guest_details.map(async (guest) => {
            let email = guest.email;
            await sendEmailWithAttachment(email, subject, message, pdfPath);
          });

        let email = user.email;
        await sendEmailWithAttachment(email, subject, message, pdfPath);

        if (user?.registration_type == "couples") {
          let partner_ref = user.partner_ref;

          let partnerData = await UserModel.findById(partner_ref).session(
            session
          );

          if (!partnerData) throw createError.NotFound("Partner Not Found");

          let partnerEmail = partnerData?.email;

          await sendEmailWithAttachment(
            partnerEmail,
            subject,
            message,
            pdfPath
          );
        }

        //   fs.unlink(pdfPath, (err) => {
        //     if (err) {
        //       console.error("Error deleting PDF:", err);
        //     }
        //   });
      }

      await session.commitTransaction();
      session.endSession();

      res
        .status(200)
        .json({ message: "Booking created successfully", booking });
    } catch (err) {
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          const destinationFolder = path.join(
            __dirname,
            `../../public/idcardImages/${file.filename}`
          );
          fs.unlink(destinationFolder, (err) => {
            if (err) {
              console.error("error deleting picture");
            }
          });
        });
      }

      if (pdfPath) {
        fs.unlink(pdfPath, (err) => {
          if (err) {
            console.error("Error deleting PDF:", err);
          }
        });
      }

      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  },
  getInprocessBookings: async (req, res, next) => {
    try {
      let userId = req.params.id;

      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      let bookings = await BookingModel.find({
        userId: userId,
        booking_status: "inprocess",
        "event_data.event_date": { $gte: currentDate },
      });

      res.status(200).json({
        message: "Successfully Retrieved Data",
        data: bookings && bookings.length > 0 ? bookings : [],
      });
    } catch (err) {
      next(err);
    }
  },
  getEventBooking: async (req, res, next) => {
    try {
      let eventId = req.params.eventId;

      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      let bookings = await BookingModel.find({
        eventId: eventId,
      });

      res.status(200).json({
        message: "Successfully Retrieved Data",
        data: bookings && bookings.length > 0 ? bookings : [],
      });
    } catch (err) {
      next(err);
    }
  },
  getUserEventsHistory: async (req, res, next) => {
    try {
      let userId = req.params.id;

      let bookings = await BookingModel.find({
        userId: userId,
        booking_status: "completed",
      });

      res.status(200).json({
        message: "Successfully Retrieved Data",
        data: bookings && bookings.length > 0 ? bookings : [],
      });
    } catch (err) {
      next(err);
    }
  },
  changeArrivalTime: async (req, res, next) => {
    try {
      let { bookingId, arrivalTime } = req.body;

      if (!bookingId || !arrivalTime) {
        throw createError.BadRequest("Required fields are missing");
      }

      let updatedBooking = await BookingModel.findByIdAndUpdate(
        bookingId,
        {
          $set: { arrival_time: arrivalTime },
        },
        { new: true }
      );

      if (updatedBooking) {
        res.status(200).json({
          message: "Arrival Time Successfully Updated",
          data: updatedBooking,
        });
      } else {
        res.status(200).json({
          message: "No Booking Found",
          data: [],
        });
      }
    } catch (err) {
      next(err);
    }
  },

  cancelBooking: async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const bookingId = req.params.id;

      if (!bookingId) {
        throw createError.BadRequest("Booking id is missing");
      }

      const bookingData = await BookingModel.findById(bookingId);

      if (bookingData.booking_status == "cancelled")
        throw createError.BadRequest("Booking has already been cancelled");

      const cancelledBooking = await BookingModel.findByIdAndUpdate(
        bookingId,
        {
          $set: { booking_status: "cancelled", cancellation_date: new Date() },
        },
        { new: true, session }
      );

      if (cancelledBooking) {
        const guests = cancelledBooking.guest_details;
        const eventName = cancelledBooking.event_data?.event_name;
        const subject = "Event Cancellation";
        const message = `The booking of event ${eventName} has been cancelled`;

        if (guests && guests.length > 0) {
          for (const guest of guests) {
            const email = guest.email;
            await sendEmail(email, subject, message);
          }
        }

        if (
          cancelledBooking.selected_booking_type?.registration_type?.toLowerCase() ===
          "couples"
        ) {
          const coupleId = cancelledBooking.user_data?.partner_ref;
          const coupleData = await UserModel.findById(coupleId).session(
            session
          );
          const coupleEmail = coupleData.email;

          await sendEmail(coupleEmail, subject, message);
        }

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
          message: "Booking has been successfully cancelled",
          data: cancelledBooking,
        });
      } else {
        await session.abortTransaction();
        session.endSession();

        res.status(200).json({
          message: "No Booking Found",
          data: [],
        });
      }
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  },
};

module.exports = EventBookingController;
