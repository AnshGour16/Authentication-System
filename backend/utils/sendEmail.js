const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
        return null;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // SSL direct connection
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });
    }

    return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const activeTransporter = getTransporter();

        if (!activeTransporter) {
            console.log("=================================================");
            console.log(`[DEVELOPMENT MODE - EMAIL NOT CONFIGURED]`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${text || html}`);
            console.log("=================================================");
            return { success: true, mode: "development" };
        }

        const info = await activeTransporter.sendMail({
            from: `"Auth Support" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log("Email sent successfully: %s", info.messageId);
        return { success: true, info };
    } catch (error) {
        console.error("Error sending email:", error.message || error);
        throw error;
    }
};

module.exports = sendEmail;
