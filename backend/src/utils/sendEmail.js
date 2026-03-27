import nodemailer from "nodemailer";

function getMailConfig() {
  return {
    host: process.env.SMTP_HOST?.trim() || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() || "",
    pass: process.env.SMTP_PASS?.trim() || "",
    from: process.env.MAIL_FROM?.trim() || ""
  };
}

export function isMailConfigured() {
  const config = getMailConfig();
  return Boolean(config.host && config.port && config.user && config.pass && config.from);
}

function createTransporter() {
  const config = getMailConfig();

  if (!isMailConfigured()) {
    throw new Error("SMTP settings are incomplete.");
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

function formatExpiry(expiresAt) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(expiresAt);
}

export async function sendPasswordResetEmail({ email, name, resetUrl, expiresAt }) {
  const transporter = createTransporter();
  const { from } = getMailConfig();
  const greetingName = name?.trim() || "there";
  const expiryLabel = formatExpiry(expiresAt);

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset your NoteSphere password",
    text: [
      `Hi ${greetingName},`,
      "",
      "We received a request to reset your NoteSphere password.",
      `Use this link to set a new password: ${resetUrl}`,
      `This link expires on ${expiryLabel}.`,
      "",
      "If you did not request this, you can safely ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <p>Hi ${greetingName},</p>
        <p>We received a request to reset your NoteSphere password.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; background: #3349ff; color: #ffffff; text-decoration: none; border-radius: 10px;">
            Reset Password
          </a>
        </p>
        <p>If the button does not work, copy and paste this link into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires on ${expiryLabel}.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  });
}
