const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const nodemailer = require("nodemailer");

// SMTP connection string with credentials, e.g.
//   smtp://max%40maxwheeler.com:APPPASSWORD@smtp.gmail.com:587
// Lives in GCP Secret Manager; bound to the function at deploy via `secrets:`.
const FEEDBACK_SMTP_URL = defineSecret("FEEDBACK_SMTP_URL");

// Non-secret config. From MUST be the authenticated Gmail account — Gmail rewrites
// the From header to the authed account unless it's a verified send-as alias.
const APP_NAME = "Wheeler Works";
const EMAIL_FROM = process.env.FEEDBACK_EMAIL_FROM || "max@maxwheeler.com";
const EMAIL_TO = process.env.FEEDBACK_EMAIL_TO || "max@maxwheeler.com";

// Serverless has no single startup; a bound secret is present in the env at each cold
// start, so log on/off there — the closest analog to the spec's startup line.
logger.info(
  `[feedback-email] ${process.env.FEEDBACK_SMTP_URL ? "ON" : "off"} (cold start)`,
);

// Compose the notification from a feedback doc. Pure and exported so the composed
// message can be verified without sending. The subject must start with exactly
// "WheelerWorks: <APP NAME>" and stay ASCII (no em-dashes) so it isn't MIME-encoded.
function buildMessage(data) {
  const type = (data.type || "other").toString();
  const message = (data.message || "").toString();
  const email = (data.email || "").toString().trim();
  const page = (data.page || "").toString();
  const userAgent = (data.userAgent || "").toString();
  const createdAt =
    data.createdAt && typeof data.createdAt.toDate === "function"
      ? data.createdAt.toDate().toISOString()
      : "";
  const context = page || "site";

  const subject = `WheelerWorks: ${APP_NAME} - ${type} feedback (${context})`;

  const text = [
    `Type:    ${type}`,
    `From:    ${email || "(not provided)"}`,
    `Page:    ${page || "(unknown)"}`,
    `Agent:   ${userAgent || "(unknown)"}`,
    `Time:    ${createdAt || "(unknown)"}`,
    "",
    "----",
    message,
    "----",
  ].join("\n");

  const msg = { from: EMAIL_FROM, to: EMAIL_TO, subject, text };
  // Reply-To only when the submitter left an address, so I can reply to them directly.
  if (email) msg.replyTo = email;
  return msg;
}

// Runs AFTER a feedback doc is persisted (Firestore onCreate). Best-effort: any SMTP
// error is caught and logged, never thrown — the feedback is already saved, so a slow
// or failing send never affects the submitter or loses the report.
const onFeedbackCreated = onDocumentCreated(
  {
    document: "feedback/{id}",
    region: "us-central1",
    secrets: [FEEDBACK_SMTP_URL],
  },
  async (event) => {
    const data = event.data && event.data.data();
    if (!data) return;

    const smtpUrl = FEEDBACK_SMTP_URL.value();
    if (!smtpUrl) {
      logger.info(
        "[feedback-email] off (FEEDBACK_SMTP_URL unset) — feedback saved, email skipped",
      );
      return;
    }

    try {
      const transport = nodemailer.createTransport(smtpUrl);
      const msg = buildMessage(data);
      await transport.sendMail(msg);
      logger.info(`[feedback-email] sent: ${msg.subject}`);
    } catch (err) {
      logger.error("[feedback-email] send failed (feedback still saved)", err);
    }
  },
);

module.exports = { onFeedbackCreated, buildMessage };
