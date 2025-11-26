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

        // Environment variables-dan SMTP konfiqurasiyası
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Email məzmunu
        const mailOptions = {
            from: `"Swift Verify" <${process.env.SMTP_USER}>`,
            to: to,
            subject: 'Your Swift Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 20px; border-radius: 10px; color: white; text-align: center;">
                        <h1 style="margin: 0;">SWIFT VERIFY</h1>
                        <p style="margin: 5px 0 0 0; opacity: 0.9;">Secure Transaction Verification</p>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px; text-align: center;">
                        <h2 style="color: #1e3c72; margin-bottom: 20px;">Verification Code</h2>
                        <div style="background: white; padding: 20px; border: 2px dashed #1e3c72; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #1e3c72;">
                            ${verificationCode}
                        </div>
                        <p style="margin-top: 20px; color: #666;">
                            Use this code to complete your verification process.
                        </p>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #e8f4ff; border-radius: 8px;">
                        <p style="margin: 5px 0;"><strong>Reference Number:</strong> ${reference}</p>
                        <p style="margin: 5px 0;"><strong>Expires:</strong> 10 minutes</p>
                    </div>
                    
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                        <p style="color: #666; font-size: 12px;">
                            If you didn't request this code, please ignore this email.<br>
                            This is an automated message from Swift Verification System.
                        </p>
                    </div>
                </div>
            `
        };

        // Email göndər
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification code sent successfully',
                messageId: info.messageId
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
