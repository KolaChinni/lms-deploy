const nodemailer = require('nodemailer');

// Create transporter - using Gmail as default
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use App Password for Gmail
    }
  });
};

// Alternative: For other email services (SMTP)
const createSMTPTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send OTP email
exports.sendOTPEmail = async (email, otpCode) => {
  try {
    // Validate inputs
    if (!email || !otpCode) {
      throw new Error('Email and OTP code are required');
    }

    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email configuration missing. OTP would be:', otpCode);
      // In development, you might want to return success without actually sending
      return { success: true, development: true, otp: otpCode };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"LMS System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Login OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                .otp-code { 
                    font-size: 32px; 
                    font-weight: bold; 
                    color: #4F46E5; 
                    text-align: center; 
                    margin: 20px 0;
                    letter-spacing: 5px;
                }
                .warning { 
                    background: #FEF3C7; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 20px 0;
                    border-left: 4px solid #F59E0B;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    color: #666; 
                    font-size: 12px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Your Verification Code</h1>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>You requested a one-time password (OTP) to access your LMS account. Use the following code to complete your login:</p>
                    
                    <div class="otp-code">${otpCode}</div>
                    
                    <div class="warning">
                        <strong>Important:</strong>
                        <ul>
                            <li>This code will expire in 10 minutes</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this, please ignore this email</li>
                        </ul>
                    </div>
                    
                    <p>If you're having trouble, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} LMS System. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
      `,
      text: `Your LMS login OTP is: ${otpCode}. This code will expire in 10 minutes. Do not share this code with anyone.`
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('OTP email sent successfully to:', email);
    return { 
      success: true, 
      messageId: result.messageId,
      accepted: result.accepted
    };

  } catch (error) {
    console.error('Error sending OTP email:', error);
    
    // Handle specific error cases
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check email credentials.');
    } else if (error.code === 'EENVELOPE') {
      throw new Error('Invalid email address.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Unable to connect to email service.');
    } else {
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }
};

// Send welcome email (optional)
exports.sendWelcomeEmail = async (email, name) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Welcome email would be sent to:', email);
      return { success: true, development: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"LMS System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to LMS System!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4F46E5; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to LMS!</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <p>Hello ${name},</p>
            <p>Welcome to our Learning Management System! Your account has been successfully created.</p>
            <p>You can now access all the features and start your learning journey.</p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', email);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email - it's not critical
    return { success: false, error: error.message };
  }
};

// Test email configuration
exports.testEmailConfig = async () => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return { 
        success: false, 
        error: 'Email configuration missing in environment variables' 
      };
    }

    const transporter = createTransporter();
    await transporter.verify();
    
    return { 
      success: true, 
      message: 'Email configuration is valid and ready to send emails' 
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Email configuration test failed: ${error.message}` 
    };
  }
};