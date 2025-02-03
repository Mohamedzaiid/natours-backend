const htmlToText = require('html-to-text');
const nodeMailer = require('nodemailer');
const Transport = require('nodemailer-brevo-transport');
const pug = require('pug');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Mohamed Zaid <${process.env.EMAIL_FROM}>`;
  }

  newTransporter() {
    if (process.env.NODE_ENV === 'production') {
      return nodeMailer.createTransport(
        new Transport({ apiKey: process.env.BREVO_API_KEY }),
      );
    }

    return nodeMailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(temp, subject) {
    const html = pug.renderFile(`${__dirname}/../views/emails/${temp}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.toString(html),
    };

    await this.newTransporter().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome To Natours Family');
  }

  async sendPasswordRest() {
    await this.send(
      'passwordRest',
      'Your password reset token (valid for 10 mintues)',
    );
  }
};

// const sendEmail = async (options) => {
//   // create the transporter
//   const transporter = nodeMailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   // create mailOptions
//   const mailOptions = {
//     from: 'Mohamed Zaid <moozaid86@gamil.com>',
//     to: options.email,
//     subject: options.subject,
//     text: options.messsage,
//     // html:
//   };
//   // send email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
