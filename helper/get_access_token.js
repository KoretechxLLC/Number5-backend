
const {google} = require("googleapis")
const path = require("path")


function getAccessToken() {
    return new Promise(function(resolve, reject) {

        const destinationFolder = path.join(__dirname, '../service-account');

        console.log(destinationFolder,"folder")

    const SCOPES = 'https://www.googleapis.com/auth/firebase.messaging'

      const key = require(destinationFolder);
      const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        SCOPES,
        null
      );
      jwtClient.authorize(function(err, tokens) {
        if (err) {
          reject(err);
          return;
        }
        resolve(tokens.access_token);
      });
    });
  }

 module.exports = {
    getAccessToken : getAccessToken
 }