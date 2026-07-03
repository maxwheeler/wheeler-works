// Prove the composed feedback email end-to-end WITHOUT real SMTP: build the message,
// run it through nodemailer's jsonTransport sink, and assert the spec's requirements.
const assert = require("node:assert");
const nodemailer = require("nodemailer");
const { buildMessage } = require("./index");

const sink = nodemailer.createTransport({ jsonTransport: true });

// A submitted feedback doc that carries a reply email (createdAt mimics a Firestore Timestamp).
const withEmail = {
  type: "bug",
  message: "The tag filter clears when I hit back.",
  email: "user@example.com",
  page: "https://wheelerworks.us/tools/word-wrangler",
  userAgent: "Mozilla/5.0 Test",
  createdAt: { toDate: () => new Date("2026-07-02T12:00:00Z") },
};

const noEmail = { ...withEmail, email: "" };

async function composed(doc) {
  const info = await sink.sendMail(buildMessage(doc));
  return JSON.parse(info.message);
}

(async () => {
  const a = await composed(withEmail);
  assert.ok(
    a.subject.startsWith("WheelerWorks: Wheeler Works"),
    `subject must start with "WheelerWorks: Wheeler Works", got: ${a.subject}`,
  );
  assert.strictEqual(a.subject, "WheelerWorks: Wheeler Works - bug feedback (https://wheelerworks.us/tools/word-wrangler)");
  // eslint-disable-next-line no-control-regex
  assert.ok(/^[\x00-\x7F]*$/.test(a.subject), "subject must be ASCII");
  assert.strictEqual(a.to[0].address, "max@maxwheeler.com", "To must be max@maxwheeler.com");
  assert.strictEqual(a.from.address, "max@maxwheeler.com", "From must be max@maxwheeler.com");
  assert.strictEqual(a.replyTo[0].address, "user@example.com", "Reply-To must be the submitter");
  assert.ok(a.text.includes("The tag filter clears when I hit back."), "body must contain the message");
  assert.ok(a.text.includes("----"), "body must have ---- divider lines");

  const b = await composed(noEmail);
  assert.ok(b.replyTo === undefined, "Reply-To must be omitted when no submitter email");

  console.log("PASS subject:", a.subject);
  console.log("PASS To:", a.to[0].address, "| From:", a.from.address, "| Reply-To:", a.replyTo[0].address);
  console.log("PASS no-email case omits Reply-To:", b.replyTo === undefined);
  console.log("PASS body divider + message present");
  console.log("\n--- composed body (with email) ---\n" + a.text);
})().catch((e) => {
  console.error("FAIL", e.message);
  process.exit(1);
});
