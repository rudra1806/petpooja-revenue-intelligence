const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send an email verification link to a newly registered user.
 * @param {string} toEmail - Recipient email address
 * @param {string} name    - Recipient display name
 * @param {string} token   - Verification token (UUID or crypto random)
 */
const sendVerificationEmail = async (toEmail, name, token) => {
    const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: `"Voice AI Assistant" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: "✅ Verify your email address",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px;
                    background: #0f0f1a; color: #e2e8f0; border-radius: 16px;">
            <h2 style="color: #7c3aed; margin-bottom: 8px;">Hello, ${name}! 👋</h2>
            <p style="color: #94a3b8; margin-bottom: 24px;">
                Thanks for signing up with <strong>Voice AI Assistant</strong>.<br/>
                Click the button below to verify your email address.
            </p>
            <a href="${verifyUrl}"
               style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #7c3aed, #4f46e5);
                      color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
                ✅ Verify Email
            </a>
            <p style="margin-top: 24px; color: #64748b; font-size: 12px;">
                This link expires in <strong>24 hours</strong>.<br/>
                If you did not register, ignore this email.
            </p>
        </div>
        `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
