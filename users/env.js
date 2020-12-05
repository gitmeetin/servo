require("dotenv").config();

let hosts = [];
let callbackUrl = "";

if (process.env.NODE_ENV === "production") {
  // React App Deployed URLs
  hosts = ["https://gitmeet.io", "https://gitmeet.netlify.app"];
  callbackUrl = "https://gitmeet.io/api";
} else {
  // React App URL
  hosts = ["http://localhost:3000"];
  callbackUrl = "http://localhost:8080";
}

module.exports = { hosts, callbackUrl };
