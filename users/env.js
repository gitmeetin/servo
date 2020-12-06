require("dotenv").config();

let hosts = [];
let callbackUrl = "";

if (process.env.NODE_ENV === "production") {
  // React App Deployed URLs
  hosts = ["https://gitmeet.io", "https://gitmeet.netlify.app"];
  callbackUrl =
    "https://asia-south1-shark-hacks-297613.cloudfunctions.net/gitmeet-api-users-dev-callback";
} else {
  // React App URL
  hosts = ["http://localhost:3000"];
  callbackUrl =
    "https://asia-south1-shark-hacks-297613.cloudfunctions.net/gitmeet-api-users-dev-callback";
}

module.exports = { hosts, callbackUrl };
