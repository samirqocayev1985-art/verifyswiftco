const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Only POST allowed
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { to, code } = JSON.parse(event.body);

        // Input validation
        if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid email address' 
                })
            };
        }

        if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid verification code format' 
                })
            };
        }

        console.log(`[EMAIL] Sending to: ${to}, Code: ${code}`);

        // ✅ ÖZ-İMZALANMIŞ SERTİFİKATA İCAZƏ VER
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'sh003.megahost.kz',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER || 'check@swift-verify.com',
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false  // ✅ BU ƏN VACİBDİR!
            }
        });

        // Əvvəlcə serveri test et
        await transporter.verify();
        console.log('[EMAIL] SMTP server verified');

        const mailOptions = {
            from: `"SWIFT Verification" <${process.env.EMAIL_FROM || 'check@swift-verify.com'}>`,
            to: to,
            subject: 'Your Verification Code - SWIFT Secure Portal',
            html: `... your HTML template ...`, // Əvvəlki template buraya
            text: `Your verification code is: ${code}`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL SUCCESS] Message ID:', info.messageId);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification code sent successfully'
            })
        };

    } catch (error) {
        console.error('[EMAIL ERROR]', error.message);
        
        // Dəqiq xəta mesajı
        let userMessage = 'Unable to send verification code. Please try again later.';
        
        if (error.code === 'EAUTH') {
            userMessage = 'Email authentication failed. Please check SMTP credentials.';
        } else if (error.code === 'ECONNREFUSED') {
            userMessage = 'Cannot connect to email server.';
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: userMessage,
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};
