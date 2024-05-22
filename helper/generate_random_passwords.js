const UserModel = require("../src/Models/user.model");


const generateRandomPassword = async (length) => {


    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[];:<>,.?/";
    let generatedPass = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        generatedPass += charset[randomIndex];
    }
    return generatedPass;

}


const generateMembershipID = async (length) => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let generatedID = "";

    while (true) {
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            generatedID += charset[randomIndex];
        }

        // Check if the generated ID already exists in the system
        const idExists = await UserModel.findOne({ membership_id: generatedID });

        // If the ID doesn't exist, return it
        if (!idExists) {
            return generatedID;
            break;
        }

        // If the ID exists, generate a new one
        generatedID = "";
    }
}



const generateUsername = async (user) => {
    const { full_name } = user;

    // Split full name into first and last name
    const nameParts = full_name.toLowerCase().split(" ");
    const firstName = nameParts?.[0];
    const lastName = nameParts?.[1];

    // Construct base username by concatenating first name and last name
    let baseUsername = (firstName || "") + (lastName || "");

    // Check if the base username already exists in the system
    let username = baseUsername;

    let counter = Math.floor(Math.random() * 100); // Adjust the range as needed

    while (true) {
        // Append a counter to the base username

        let tempUsername = username;
        if (counter > 1) {
            tempUsername = baseUsername + counter;
        }

        // Check if the username exists in the database
        const usernameExists = await UserModel.findOne({ username: tempUsername });

        // If username doesn't exist, set it as the generated username and exit the loop
            if(!usernameExists){
            username = tempUsername + counter;
            break;
        }

        counter++;
    }

    return username;
}




module.exports = {
    generateRandomPassword : generateRandomPassword,
    generateMembershipID : generateMembershipID,
    generateUsername : generateUsername
}