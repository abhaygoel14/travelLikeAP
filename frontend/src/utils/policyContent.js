import { get, ref, set } from "firebase/database";
import { firebaseReady, realtimeDb } from "./firebaseConfig";

export const POLICY_PAGE_CONFIG = [
  {
    key: "terms",
    title: "Terms & Conditions",
    route: "/terms-and-conditions",
    defaultHtml: `
      <h2>Terms & Conditions</h2>
      <p>Welcome to Travel Like AP. Please read these terms carefully before booking any trip or using our services.</p>
      <h3>Bookings</h3>
      <p>All bookings are subject to availability and confirmation from our team.</p>
      <h3>Payments</h3>
      <p>Prices, taxes, and service charges shown at checkout must be cleared before final confirmation.</p>
      <h3>Traveller Responsibility</h3>
      <p>Travellers must provide accurate personal information and carry required IDs or permits when needed.</p>
    `,
  },
  {
    key: "privacy",
    title: "Privacy Policy",
    route: "/privacy-policy",
    defaultHtml: `
      <h2>Privacy Policy</h2>
      <p>We respect your privacy and use your information only to support bookings, service updates, and customer care.</p>
      <h3>Information We Collect</h3>
      <p>This may include your name, email, phone number, and booking preferences.</p>
      <h3>How We Use It</h3>
      <p>Your information is used to manage reservations, improve service quality, and communicate important trip details.</p>
      <h3>Data Safety</h3>
      <p>We take reasonable precautions to protect your personal information stored on our platform.</p>
    `,
  },
  {
    key: "cancellation",
    title: "Cancellation & Refund Policy",
    route: "/cancellation-refund-policy",
    defaultHtml: `
      <h2>Cancellation & Refund Policy</h2>
      <p>Refunds and cancellation eligibility may depend on the departure date, booking stage, and partner rules.</p>
      <h3>Before Departure</h3>
      <p>Refund amounts may vary depending on the number of days left before the trip begins.</p>
      <h3>Processing Time</h3>
      <p>Approved refunds are usually processed within a few business days to the original payment source.</p>
      <h3>Non-refundable Charges</h3>
      <p>Certain taxes, convenience fees, or third-party charges may be non-refundable.</p>
    `,
  },
];

const POLICY_DEFAULTS = Object.fromEntries(
  POLICY_PAGE_CONFIG.map((item) => [item.key, item]),
);

export const normalizePolicyContent = (policyKey, value = {}) => {
  const config = POLICY_DEFAULTS[policyKey] || POLICY_PAGE_CONFIG[0];

  return {
    key: config.key,
    title: String(value?.title || config.title).trim() || config.title,
    route: config.route,
    html: String(value?.html || config.defaultHtml || "").trim(),
    updatedAt: String(value?.updatedAt || "").trim(),
    updatedBy: String(value?.updatedBy || "").trim(),
  };
};

export const fetchAllPolicyContent = async () => {
  if (!firebaseReady || !realtimeDb) {
    return Object.fromEntries(
      POLICY_PAGE_CONFIG.map((item) => [
        item.key,
        normalizePolicyContent(item.key),
      ]),
    );
  }

  try {
    const snapshot = await get(ref(realtimeDb, "siteContent/policies"));
    const rawValue = snapshot.exists() ? snapshot.val() : {};

    return Object.fromEntries(
      POLICY_PAGE_CONFIG.map((item) => [
        item.key,
        normalizePolicyContent(item.key, rawValue?.[item.key]),
      ]),
    );
  } catch (error) {
    console.warn("Unable to fetch policy content:", error);
    return Object.fromEntries(
      POLICY_PAGE_CONFIG.map((item) => [
        item.key,
        normalizePolicyContent(item.key),
      ]),
    );
  }
};

export const fetchPolicyContent = async (policyKey) => {
  const allPolicies = await fetchAllPolicyContent();
  return allPolicies[policyKey] || normalizePolicyContent(policyKey);
};

export const savePolicyContent = async (
  policyKey,
  payload = {},
  editorUid = "admin",
) => {
  if (!firebaseReady || !realtimeDb) {
    throw new Error(
      "Firebase is not configured. Add your Firebase keys to save policy pages.",
    );
  }

  const normalizedPolicy = normalizePolicyContent(policyKey, payload);
  const nextPayload = {
    ...normalizedPolicy,
    updatedAt: new Date().toISOString(),
    updatedBy: editorUid,
  };

  await set(ref(realtimeDb, `siteContent/policies/${policyKey}`), nextPayload);
  return nextPayload;
};
