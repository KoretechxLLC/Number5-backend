const express = require("express");
const cors = require("cors");
const protectedRoutes = require("./src/Routes/ProtectedRoutes/ProtectedRoutes");
const authRoutes = require("./src/Routes/AuthRoutes/authRoutes");
const createError = require("http-errors");
const morgan = require("morgan");
const path = require("path");
require("./helper/mongodb_init");

const PORT = process.env.Port || 5000;

const app = express();

app.use(morgan("dev"));
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/registrationImages",
  express.static(path.join(__dirname, "public", "registrationImages"))
);
app.use(
  "/eventImages",
  express.static(path.join(__dirname, "public", "eventImages"))
);
app.use(
  "/profileImages",
  express.static(path.join(__dirname, "public", "profileImages"))
);
app.use(
  "/eventQrImages",
  express.static(path.join(__dirname, "public", "eventQrImages"))
);
app.use(
  "/idcardImages",
  express.static(path.join(__dirname, "public", "idcardImages"))
);
app.use(
  "/ticketback",
  express.static(path.join(__dirname, "public", "ticketback"))
);

app.use(
  "/PDF",
  express.static(path.join(__dirname, "public", "PDF"))
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", protectedRoutes);
app.use("/auth", authRoutes);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);

  res.json({
    status: err?.status || 500,
    message: err.message,
  });
});

app.listen(PORT, () => console.log(`App running on localhost:${PORT}`));
