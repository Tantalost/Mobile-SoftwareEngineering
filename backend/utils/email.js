import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {

  const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: process.env.EMAIL_USERNAME, 
      pass: process.env.EMAIL_PASSWORD  
    }
  });

 
  const mailOptions = {
    from: 'IBT Stall Application <noreply@ibtstall.com>',
    to: options.to,
    subject: options.subject,
    text: options.text,
    
  };

 
  await transporter.sendMail(mailOptions);
};