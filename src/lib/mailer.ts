import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT ?? 1025);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port,
  secure: port === 465,
  ignoreTLS: !process.env.SMTP_USER,
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: '"JMC HRD" <noreply@jmc.co.id>',
    to,
    subject: "Kode OTP Login",
    text: `Kode OTP Anda: ${otp}\n\nBerlaku selama 60 detik. Jangan bagikan ke siapapun.`,
    html: `<p>Kode OTP Anda: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>Berlaku selama <b>60 detik</b>. Jangan bagikan ke siapapun.</p>`,
  });
}

export async function sendPasswordEmail(to: string, username: string, password: string): Promise<void> {
  await transporter.sendMail({
    from: '"JMC HRD" <noreply@jmc.co.id>',
    to,
    subject: "Akun JMC HRD Anda",
    text: `Halo ${username},\n\nAkun Anda telah dibuat.\nUsername: ${username}\nPassword: ${password}\n\nSilakan login dan ganti password Anda segera.`,
    html: `<p>Halo <b>${username}</b>,</p><p>Akun Anda telah dibuat.</p><table><tr><td>Username</td><td><b>${username}</b></td></tr><tr><td>Password</td><td><b>${password}</b></td></tr></table><p>Silakan login dan ganti password Anda segera.</p>`,
  });
}
