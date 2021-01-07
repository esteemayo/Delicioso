const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const pug = require('pug');

class Mail {
    constructor(user, url) {
        this.to = user.email;
        this.name = user.name;
        this.firstName = user.firstName;
        this.url = url;
        this.from = `Emmanuel Adebayo <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // SendGrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            });
        }
        // Mailtrap
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Send the actual email
    async send(template, subject) {
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            name: this.name,
            firstName: this.firstName,
            url: this.url,
            subject
        });

        // Render HTML based on a pug template
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        };

        // Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    async sendWelcome() {
        await this.send('welcome', 'Welcome to delicioso! Your best online store.');
    }

    async sendPasswordReset() {
        await this.send('passwordReset', 'Your delicioso password reset token (valid for 10 mins)');
    }

    async sendLoginNotification() {
        await this.send('loginNotification', 'DELICIOSO LOG IN NOTIFICATION!');
    }
}

module.exports = Mail;