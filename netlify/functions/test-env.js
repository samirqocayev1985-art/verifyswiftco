const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
  console.log('Testing SMTP connection...');
  
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Test connection
    await transporter.verify();
    console.log('SMTP connection SUCCESS');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'SMTP connection successful' })
    };
    
  } catch (error) {
    console.error('SMTP connection FAILED:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
