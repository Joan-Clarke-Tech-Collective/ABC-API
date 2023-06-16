const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors({origin: true}));

const serviceAccount = require("./permissions.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fir-api-9a206..firebaseio.com",
});
const db = admin.firestore();
db.settings({ignoreUndefinedProperties: true});

require("./message")(app);
require("./prison")(app);
require("./prisoner")(app);
require("./rule")(app);
require("./user")(app);

exports.app = functions.https.onRequest(app);
