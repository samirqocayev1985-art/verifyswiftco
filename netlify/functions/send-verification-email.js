const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // CORS başlıqları
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS sorğusu üçün
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' })
        };
    }

    try {
        const { to, verificationCode, reference } = JSON.parse(event.body);

        if (!to || !verificationCode) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Missing required fields' })
            };
        }

        // Email konfiqurasiyası - VERİLƏN SMTP AYARLARI
        const transporter = nodemailer.createTransporter({
            host: 'mail.verify-swift.com',
            port: 465,
            secure: true,
            auth: {
                user: 'check@verify-swift.com',
                pass: process.env.SMTP_PASSWORD // NETLIFY-DA TƏYİN EDİN
            }
        });

        const mailOptions = {
            from: 'check@verify-swift.com',
            to: to,
            subject: 'Your Swift Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1e3c72;">Swift Verification System</h2>
                    <p>Your verification code is:</p>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #1e3c72;">
                        ${verificationCode}
                    </div>
                    <p><strong>Reference:</strong> ${reference}</p>
                    <p>This code will expire in 10 minutes.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">
                        If you didn't request this code, please ignore this email.
                    </p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification code sent successfully' 
            })
        };

    } catch (error) {
        console.error('Email sending error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Failed to send email: ' + error.message 
            })
        };
    }
};
