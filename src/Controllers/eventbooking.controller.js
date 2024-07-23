const BookingModel = require("../Models/event.booking.model");
const EventModel = require("../Models/event.model");
const UserModel = require("../Models/user.model");
const createError = require("http-errors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { PDFDocument, rgb } = require("pdf-lib");
const puppeteer = require("puppeteer");
const fontkit = require("@pdf-lib/fontkit");
const {
  sendEmailWithAttachment,
  sendEmail,
} = require("../../helper/send_email");

async function generatePDF(data) {
  const pdfDoc = await PDFDocument.create();

  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([200, 260]);
  const imagePath = path.resolve(
    __dirname,
    "../../public/images/ticketback.png"
  );
  const imageBytes = fs.readFileSync(imagePath);

  const image = await pdfDoc.embedPng(imageBytes);

  const { width, height } = image.scale(1);

  const fontBytes = fs.readFileSync(
    path.join(__dirname, "../fonts/PoppinsRegular400.ttf")
  );
  const customFont = await pdfDoc.embedFont(fontBytes);

  page.setFont(customFont);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 200,
    height: 260,
    borderRadius: 10,
    borderColor: rgb(0.08, 0.2, 0.12),
    borderWidth: 2,
    color: rgb(33 / 255, 34 / 255, 38 / 255),
  });

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: 200,
    height: 260,
  });

  const eventTicketText = "Event Ticket";
  const eventTicketSize = 16;
  const eventTicketWidth = customFont.widthOfTextAtSize(
    eventTicketText,
    eventTicketSize
  );
  const eventTicketX = (200 - eventTicketWidth) / 2;

  page.drawText(eventTicketText, {
    x: eventTicketX,
    y: 230,
    size: eventTicketSize,
    color: rgb(1, 1, 1),
  });

  const sections = [
    { label: "Name:", value: data.username, y: 200 },
    { label: "Membership Type:", value: data.membership_type, y: 175 },
    { label: "Ticket Type:", value: data.ticket_type, y: 150 },
    { label: "Event Name:", value: data.event_name, y: 125 },
    { label: "Date:", value: data.event_date, y: 100 },
    { label: "Event Time:", value: data.event_start_time, y: 75 },
    { label: "No. of guests:", value: data.no_of_guests, y: 50 },
    {
      label: "Amount:",
      value: `${
        data?.payment_option?.toLowerCase() == "cash" ? "Pay at Venue" : "Paid"
      } £${data.amount}`,
      y: 25,
    },
  ];

  const marginBottom = 10;

  sections.forEach((section) => {
    page.drawText(section.label, {
      x: 5,
      y: section.y,
      size: 7,
      color: rgb(1, 1, 1),
    });

    const textWidth = customFont.widthOfTextAtSize(section.value, 7);
    const xPosition = 195 - textWidth;

    page.drawText(section.value, {
      x: xPosition - 5,
      y: section.y,
      size: 7,
      color: rgb(239 / 255, 187 / 255, 30 / 255),
    });

    page.drawLine({
      start: { x: 5, y: section.y - 8 },
      end: { x: 195, y: section.y - 8 },
      thickness: 0.5,
      color: rgb(0.71, 0.71, 0.71),
    });
  });

  const pdfBytes = await pdfDoc.save();

  const sanitizedUsername = data.username.replace(/\s/g, "");
  const sanitizedEventName = data.event_name.replace(/\s/g, "");
  const pdfPath =
    path.join(__dirname, "../../public/PDF/") +
    `ticket${sanitizedUsername}${sanitizedEventName}.pdf`;
  fs.writeFileSync(pdfPath, pdfBytes);

  return pdfPath;
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
        shop_items,
        amount,
      } = req.body;

      if (guest_details) {
        guest_details = JSON.parse(guest_details);
      }

      if (selected_booking_type) {
        selected_booking_type = JSON.parse(selected_booking_type);
      }

      if (shop_items) {
        shop_items = JSON.parse(shop_items);
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

      // if (!amount) throw createError.BadRequest("Amount is missing");

      if (
        Number(no_of_guests) > 0 &&
        guest_details.length !== Number(no_of_guests)
      ) {
        throw createError.BadRequest("Guest details are missing");
      }

      if (!selected_booking_type)
        throw createError.BadRequest("Booking type is missing");

      // if (!payment_option)
      //   throw createError.BadRequest("Payment Option is missing");

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
        shop_items: shop_items,
        no_of_guests,
        guest_details,
        arrival_time,
        payment_option,
        is_fee_paid: false,
        is_event_attended: false,
        status: "booked",
        booking_status: "inprocess",
        total_amount: amount ?? 0,
      };

      let booking = await BookingModel.create([bookingData], { session });

      let dataToSend = {
        username: user.first_name + " " + user?.last_name,
        membership_type: user.membership.package_name,
        event_date: new Date(event.event_date).toLocaleDateString(),
        event_start_time: event.event_start_time,
        ticket_type: selected_booking_type?.type,
        no_of_guests: no_of_guests,
        event_name: event?.event_name,
        payment_option: payment_option ? payment_option : "Paid",
        amount: amount ?? 0,
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
  consumeBooking: async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let { bookingId, attendedTime } = req.body;

      if (!bookingId || !attendedTime)
        throw createError.BadRequest("Required fields are missing");

      let booking = await BookingModel.findById(bookingId).session(session);

      if (!booking) throw createError.NotFound("Booking Not Found");

      if (booking.is_event_attended || booking.booking_status == "completed") {
        throw createError.BadRequest("You have already attended this event");
      }

      let eventDate = booking.event_data.event_date;

      eventDate = new Date(eventDate);
      attendedTime = new Date(attendedTime);

      let eventDay = eventDate.getDate();
      let eventMonth = eventDate.getMonth();
      let eventYear = eventDate.getFullYear();

      let day = attendedTime.getDate();
      let month = attendedTime.getMonth();
      let year = attendedTime.getFullYear();

      if (eventDay != day || eventMonth != month || eventYear != year) {
        throw createError.BadRequest("You can only attend event on event date");
      }

      if (booking.booking_status == "cancelled")
        throw createError.BadRequest("You have already cancelled this booking");

      booking.booking_status = "completed";
      booking.is_fee_paid = true;
      booking.is_event_attended = true;
      booking.attendedTime = new Date(attendedTime);

      await booking.save({ session });

      let userId = booking.userId;
      let user = await UserModel.findById(userId).session(session);

      let bookingSelectedType = booking?.selected_booking_type?.type;
      let membershipBookingType = user.membership.booking_type;

      let isExists =
        membershipBookingType &&
        membershipBookingType.length > 0 &&
        membershipBookingType.some((e, i) => {
          return e.type == bookingSelectedType;
        });

      if (isExists && !user.membership.default_membership) {
        if (Number(user.membership.remainingVisits) <= 0) {
          throw createError.BadRequest(
            "You don't have enough visits to attend this event"
          );
        }

        user.membership.consumedPasses = user.membership.consumedPasses + 1;
        user.membership.remainingVisits = user.membership.remainingVisits - 1;

        user.event_visits = user?.event_visits + 1;

        user.markModified("membership");
        await user.save({ session });
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        message: "Booking consumed successfully",
        bookingData: booking,
        userData: user,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  },
};

module.exports = EventBookingController;
