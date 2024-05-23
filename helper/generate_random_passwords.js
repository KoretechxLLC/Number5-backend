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

const generateMembershipID = async (length) => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let generatedID = "";

  while (true) {
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      generatedID += charset[randomIndex];
    }

    const idExists = await UserModel.findOne({ membership_id: generatedID });

    if (!idExists) {
      return generatedID;
      break;
    }

    generatedID = "";
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

module.exports = {
  generateRandomPassword: generateRandomPassword,
  generateMembershipID: generateMembershipID,
  generateUsername: generateUsername,
  generateOTP: generateOTP,
};
