const UserModel = require("../src/Models/user.model");

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

const generateRandomPassword = async (length) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[];:<>,.?/";
  let generatedPass = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    generatedPass += charset[randomIndex];
  }
  return generatedPass;
};

const generateMembershipID = async () => {
  const prefix = "NFMBR-";
  let generatedID = "";

  while (true) {
    const randomNumber = Math.floor(10000 + Math.random() * 90000); // Generate a random 5-digit number (10000-99999)
    generatedID = `${prefix}${randomNumber}`;

    const idExists = await UserModel.findOne({ membership_id: generatedID });

    if (!idExists) {
      return generatedID;
    }

    generateId = "";

    // If the ID exists, the loop will continue and generate a new one
  }
};

const generateUsername = async (user) => {
  const { full_name } = user;

  const nameParts = full_name.toLowerCase().split(" ");
  const firstName = nameParts?.[0];
  const lastName = nameParts?.[1];

  let baseUsername = (firstName || "") + (lastName || "");

  let username = baseUsername;

  let counter = Math.floor(Math.random() * 100);

  while (true) {
    let tempUsername = username;
    if (counter > 1) {
      tempUsername = baseUsername + counter;
    }

    const usernameExists = await UserModel.findOne({ username: tempUsername });

    if (!usernameExists) {
      username = tempUsername + counter;
      break;
    }

    counter++;
  }

  return username;
};

async function generateRandomCardNumber() {
  let cardNumber;
  let isUnique = false;

  while (!isUnique) {
    cardNumber = "";
    for (let i = 0; i < 12; i++) {
      // Generate a random digit between 0 and 9
      const digit = Math.floor(Math.random() * 10);
      cardNumber += digit;
    }

    // Check if the generated card number already exists in the database
    const cardNumberExists = await UserModel.findOne({
      cardNumber: cardNumber,
    });

    if (!cardNumberExists) {
      isUnique = true;
    }
  }

  return cardNumber;
}

module.exports = {
  generateRandomPassword: generateRandomPassword,
  generateMembershipID: generateMembershipID,
  generateUsername: generateUsername,
  generateCardNumber: generateRandomCardNumber,
  generateOTP: generateOTP,
};
