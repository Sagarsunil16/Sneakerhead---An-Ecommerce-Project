const User = require('../models/user')
const bcrypt = require('bcrypt')
const otpgenerator = require('otp-generator')
const nodemailer = require('nodemailer')


const generateOTP = () => {
    const OTP = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true
    });
    return OTP;
};
const sendInsertOtp = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
            tls: {
                rejectUnauthorized: false // Disable certificate verification
            }
        });
        const mailOptions = {
            from: 'sneakerhead16.in@gmail.com',
            to: email,
            subject: 'Your one time password',
            html: `Hi, Your OTP is ${otp}`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("email has been sent:-", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
};

const loadChangeForgotPassword = (req, res) => {
    try {
        res.render('changeForgotPassword');
    } catch (error) {
        console.error("Error while loading the change password page:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



const forgotPassword = async (req, res) => {
    try {
        const otp = generateOTP();
        console.log(otp);
        // Storing into session
        req.session.Data = { ...req.body, otp };
        req.session.save();
        console.log(req.session.Data.otp, 'wWWWWWW');
        await sendInsertOtp(req.body.email, otp);
        res.redirect('/user/changeForgotPassword');
        // Delete OTP after 30 seconds
        setTimeout(() => {
            delete req.session.Data.otp;
            req.session.save()
            console.log('OTP deleted from session after 10 minutes');
            console.log(otp)
        }, 1000000); // 30 seconds

    } catch (error) {
        console.log('otp', error.message);
        res.status(500).send('Internal Server Error');
    }
}

const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}

const changeForgotPassword = async (req, res) => {
    try {
        const { password, OTP } = req.body
        const email = req.session.Data.email
        const sPassword = await securepassword(password)
        const userData = await User.findOne({ email: email })
        if (!userData) {
            return res.status(400).json({ success: false, message: "User not found" })
        }
        if (OTP === req.session.Data.otp) {
            userData.password = sPassword
            await userData.save()
            return res.redirect("/user/login")
        }
    } catch (error) {
        console.log("Error while updating the password of the user", error.message)
        return res.status(404).json({ message: "Internal Server Error" })
    }
}

module.exports = {
    loadChangeForgotPassword,
    forgotPassword,
    changeForgotPassword
}