import crypto from "crypto";
import { prisma } from "./prisma";

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 30;

// ---- Code generation / hashing ------------------------------------------
// Only a SHA-256 hash of the code is ever stored, the same principle as
// password hashing — a leaked database still doesn't hand out valid codes.

export function generateCode() {
  const max = 10 ** CODE_LENGTH;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(CODE_LENGTH, "0");
}

export function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// ---- Issuing a code -------------------------------------------------------

export async function issueResetCode(userId) {
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetCode.create({
    // method is retained on the row for backward compatibility with existing
    // data, but the app only ever issues codes by email now.
    data: { userId, codeHash, method: "EMAIL", expiresAt },
  });

  return code;
}

export async function mostRecentCode(userId) {
  return prisma.passwordResetCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function canResend(userId) {
  const latest = await mostRecentCode(userId);
  if (!latest) return true;
  const secondsSinceLast = (Date.now() - latest.createdAt.getTime()) / 1000;
  return secondsSinceLast >= RESEND_COOLDOWN_SECONDS;
}

// ---- Verifying a code -------------------------------------------------------

export async function verifyCode(userId, code) {
  const codeHash = hashCode(code);
  const match = await prisma.passwordResetCode.findFirst({
    where: {
      userId,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!match) return false;

  await prisma.passwordResetCode.update({
    where: { id: match.id },
    data: { usedAt: new Date() },
  });

  return true;
}

// ---- Delivery ---------------------------------------------------------------
// Password-reset emails are sent through Gmail SMTP using an app password.
// Keep GMAIL_USER / GMAIL_APP_PASSWORD only in environment variables; never
// put them in client-side code.

let gmailTransporter = null;

function getGmailTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  if (!gmailTransporter) {
    // Lazy import so the app can still start when the package/credentials
    // are not configured during local development.
    const nodemailer = require("nodemailer");
    gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  return gmailTransporter;
}

export async function sendResetCodeByEmail(email, code) {
  const transporter = getGmailTransporter();

  if (!transporter) {
    console.log(`[dev] Password reset code for ${email}: ${code}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Learnora" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Learnora - Password Reset Code",
      text: `Your Learnora password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;line-height:1.6;">
          <h2 style="margin-bottom:8px;">Learnora Password Reset</h2>
          <p>We received a request to reset your Learnora password.</p>
          <p>Your password reset code is:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 0;">${code}</div>
          <p>This code will expire in <strong>10 minutes</strong>.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p>Regards,<br><strong>Learnora Team</strong></p>
        </div>
      `,
    });

    console.log("Gmail accepted the password reset email:", info.messageId);
  } catch (err) {
    console.error("Failed to send password reset email through Gmail:", err);
  }
}

export const RESEND_COOLDOWN = RESEND_COOLDOWN_SECONDS;