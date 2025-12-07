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

        // SMTP Configuration
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'sh003.megahost.kz',
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: true,
            auth: {
                user: process.env.SMTP_USER || 'check@swift-verify.com',
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Test SMTP connection
        await transporter.verify();
        console.log('[EMAIL] SMTP server verified');

        // Email content with 6-digit code
        const mailOptions = {
            from: `"SWIFT Verification" <${process.env.EMAIL_FROM || 'check@swift-verify.com'}>`,
            to: to,
            subject: 'Your SWIFT Verification Code',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SWIFT Verification Code</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f5f8fa;
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #006b3c 0%, #005a32 100%);
            padding: 30px 20px;
            text-align: center;
        }
        .header-title {
            color: white;
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 8px 0;
            letter-spacing: 1px;
        }
        .header-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin: 0;
        }
        .content {
            padding: 40px;
        }
        .title {
            color: #333;
            font-size: 24px;
            font-weight: 600;
            margin: 0 0 20px 0;
        }
        .message {
            color: #555;
            font-size: 16px;
            margin: 0 0 30px 0;
            line-height: 1.7;
        }
        .code-container {
            text-align: center;
            margin: 40px 0;
        }
        .code-box {
            display: inline-block;
            padding: 30px 50px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            border: 3px solid #006b3c;
            box-shadow: 0 8px 25px rgba(0, 107, 60, 0.15);
        }
        .code {
            font-size: 48px;
            font-weight: 800;
            color: #006b3c;
            letter-spacing: 15px;
            font-family: 'Courier New', monospace;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin: 0;
            padding-left: 15px; /* For letter-spacing centering */
        }
        .warning {
            background: #fff8e1;
            border-left: 5px solid #ffc107;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .warning-title {
            color: #333;
            font-weight: 600;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .warning-text {
            color: #666;
            margin: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .footer {
            background: #f8f9fa;
            padding: 25px 40px;
            border-top: 1px solid #e9ecef;
            text-align: center;
        }
        .footer-text {
            color: #6c757d;
            font-size: 13px;
            margin: 0 0 10px 0;
            line-height: 1.5;
        }
        .footer-small {
            color: #adb5bd;
            font-size: 12px;
            margin: 0;
        }
        .note {
            color: #666;
            font-size: 14px;
            margin: 25px 0 0 0;
            text-align: center;
        }
        @media (max-width: 480px) {
            .content { padding: 25px; }
            .code { font-size: 36px; letter-spacing: 10px; }
            .code-box { padding: 20px 30px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="header-title">SWIFT</h1>
            <p class="header-subtitle">Secure Verification Portal</p>
        </div>
        
        <div class="content">
            <h2 class="title">Your Verification Code</h2>
            
            <p class="message">
                You have requested a verification code for your SWIFT account authentication.
                Please use the following code to complete the verification process.
            </p>
            
            <div class="code-container">
                <div class="code-box">
                    <p class="code">${code}</p>
                </div>
            </div>
            
            <div class="warning">
                <p class="warning-title">⚠️ Important Security Notice</p>
                <p class="warning-text">
                    • This code will expire in <strong>10 minutes</strong><br>
                    • Do not share this code with anyone<br>
                    • SWFT will never ask for this code via phone or chat
                </p>
            </div>
            
            <p class="note">
                If you didn't request this verification code, please ignore this email or<br>
                contact our security team immediately.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                <strong>SWIFT Verification System</strong><br>
                Email: check@swift-verify.com • Support: support@swift-verify.com
            </p>
            <p class="footer-small">
                © ${new Date().getFullYear()} SWIFT Verification Portal. All rights reserved.<br>
                This is an automated message, please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
            `,
            text: `SWIFT VERIFICATION CODE\n\nYour verification code is: ${code}\n\nThis code expires in 10 minutes.\n\nImportant:\n- Do not share this code with anyone\n- SWIFT will never ask for this code via phone or chat\n\nIf you didn't request this code, please ignore this email.\n\nSWIFT Verification System\nEmail: check@swift-verify.com\nSupport: support@swift-verify.com\n\n© ${new Date().getFullYear()} SWIFT Verification Portal`
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('[EMAIL SUCCESS] Message ID:', info.messageId);

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
        // Log detailed error
        console.error('[EMAIL ERROR]', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });
        
        // User-friendly error messages
        let userMessage = 'Unable to send verification code. Please try again in a few minutes.';
        
        if (error.code === 'EAUTH') {
            userMessage = 'Email authentication failed. Please check SMTP configuration.';
        } else if (error.code === 'ECONNREFUSED') {
            userMessage = 'Cannot connect to email server. Please try again later.';
        } else if (error.code === 'ETIMEDOUT') {
            userMessage = 'Connection timed out. Please try again.';
        }
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: userMessage,
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};
