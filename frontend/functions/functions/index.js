const admin = require("firebase-admin");
const { onRequest } = require("firebase-functions/https");
const { setGlobalOptions } = require("firebase-functions");
const { defineString } = require("firebase-functions/params");
const express = require("express");
const crypto = require("crypto");

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ✅ NEW WAY: define env params
const PAYU_KEY = defineString("PAYU_KEY");
const PAYU_SALT = defineString("PAYU_SALT");
const SUCCESS_URL = defineString("PAYU_SUCCESS_URL");
const FAILURE_URL = defineString("PAYU_FAILURE_URL");

// 🔑 Generate hash
function generateHash(data) {
  const { status, txnid, amount, productinfo, firstname, email } = data;

  const hashString = [
    PAYU_SALT.value(),
    status,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    PAYU_KEY.value(),
  ].join("|");

  return crypto.createHash("sha512").update(hashString).digest("hex");
}

// 💾 Save payment
async function savePayment(data, hashVerified) {
  const db = admin.firestore();

  const orderId = data.txnid || data.mihpayid || `payu_${Date.now()}`;

  await db
    .collection("payments")
    .doc(orderId)
    .set({
      orderId,
      status: data.status || "unknown",
      hashVerified,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      payload: data,
    });

  return orderId;
}

// 🚀 PayU handler
app.post("/", async (req, res) => {
  try {
    const data = req.body;

    const status = (data.status || "failure").toLowerCase();
    const receivedHash = data.hash || "";

    let hashVerified = false;

    if (receivedHash) {
      const expectedHash = generateHash(data);
      hashVerified = expectedHash === receivedHash;
    }

    const txnid = data.txnid || "";

    const finalStatus = status === "success" ? "success" : "failure";

    const baseUrl =
      finalStatus === "success" ? SUCCESS_URL.value() : FAILURE_URL.value();

    await savePayment(data, hashVerified);

    // ✅ ADD QUERY PARAMS HERE
    const redirectUrl = `${baseUrl}?status=${finalStatus}&txnid=${encodeURIComponent(txnid)}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("PayU response error:", err);

    return res.redirect(`${FAILURE_URL.value()}?status=failure`);
  }
});

// Block other methods
app.all("*", (req, res) => {
  res.status(405).send("Method Not Allowed");
});

// ✅ Export
exports.payuResponse = onRequest(app);
