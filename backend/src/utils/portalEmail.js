import nodemailer from "nodemailer";

export async function sendPortalVerificationEmail({ to, name, code, role }) {
  const hasSmtpConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    console.log("\n================ PORTAL VERIFICATION CODE ================");
    console.log(`Role: ${role}`);
    console.log(`Name: ${name}`);
    console.log(`Email: ${to}`);
    console.log(`Verification code: ${code}`);
    console.log("==========================================================\n");

    return {
      mode: "console",
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"SME ERP" <${process.env.SMTP_USER}>`,
    to,
    subject: "Verify your SME ERP portal account",
    text: `Hello ${name},

Your ${role} portal verification code is:

${code}

This code will expire in 15 minutes.

SME ERP`,
  });

  return {
    mode: "smtp",
  };
}