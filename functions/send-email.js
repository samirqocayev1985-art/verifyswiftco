const nodemailer = require('nodemailer');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Rate limiting kontrolü
    const rateLimitKey = `rate_limit_${event.headers['client-ip'] || 'unknown'}`;
    const rateLimit = await checkRateLimit(rateLimitKey);
    
    if (rateLimit.limited) {
        return {
            statusCode: 429,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Too many requests. Please try again later.' 
            })
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

        console.log(`[EMAIL] Sending verification code to: ${to}`);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'sh003.megahost.kz',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: true
            },
            pool: true, // Connection pooling
            maxConnections: 5,
            maxMessages: 100
        });

        const mailOptions = {
            from: `"SWIFT Verification" <${process.env.EMAIL_FROM || 'check@swift-verify.com'}>`,
            replyTo: process.env.SUPPORT_EMAIL || 'support@swift-verify.com',
            to: to,
            subject: 'Your Verification Code - SWIFT Secure Portal',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>SWIFT Verification Code</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #006b3c 0%, #005a32 100%); padding: 30px 20px; text-align: center;">
                            <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 10px;">SWIFT</div>
                            <div style="color: rgba(255,255,255,0.9); font-size: 16px;">Secure Verification Portal</div>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <h2 style="color: #333; margin-bottom: 25px; font-size: 22px;">Verification Code Required</h2>
                            
                            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                                You've requested a verification code for your SWIFT account. 
                                Use the code below to complete your verification process.
                            </p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <div style="display: inline-block; padding: 25px 40px; background: #f8f9fa; border-radius: 12px; border: 2px solid #e1e5e9;">
                                    <div style="font-size: 36px; font-weight: bold; color: #006b3c; letter-spacing: 8px; font-family: monospace;">
                                        ${code}
                                    </div>
                                </div>
                            </div>
                            
                            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #006b3c; margin: 30px 0;">
                                <p style="color: #333; margin: 0; font-size: 14px;">
                                    <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>.
                                    Do not share this code with anyone.
                                </p>
                            </div>
                            
                            <p style="color: #999; font-size: 13px; line-height: 1.5;">
                                If you didn't request this verification code, please ignore this email or 
                                contact our support team immediately.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="background: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e1e5e9;">
                            <p style="color: #999; font-size: 12px; margin: 0 0 15px 0;">
                                <strong>From:</strong> SWIFT Verification System<br>
                                <strong>Email:</strong> check@swift-verify.com<br>
                                <strong>Support:</strong> support@swift-verify.com
                            </p>
                            <p style="color: #999; font-size: 11px; margin: 0;">
                                &copy; ${new Date().getFullYear()} SWIFT Verification Portal. All rights reserved.<br>
                                This is an automated message, please do not reply directly to this email.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
SWIFT Verification Portal

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

From: SWIFT Verification System
Email: check@swift-verify.com
Support: support@swift-verify.com
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        // Log success
        console.log(`[EMAIL SUCCESS] Sent to ${to}, Message ID: ${info.messageId}`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Verification code sent successfully',
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        // Error logging
        console.error('[EMAIL ERROR]', {
            error: error.message,
            code: error.code,
            stack: error.stack
        });
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Unable to send verification code. Please try again in a few minutes.'
            })
        };
    }
};

// Rate limiting function
async function checkRateLimit(key) {
    // Burada rate limiting implement edebilirsiniz
    // Örnek: Redis veya database kullanarak
    return { limited: false, remaining: 5 };
}
