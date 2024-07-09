const User = require('../models/user'); // Adjust the path accordingly

const isLoggedin = async (req, res, next) => {
    try {
        if (req.session && req.session.passport && req.session.passport.user) {
            const userId = req.session.passport.user;
            console.log(userId);
            const user = await User.findById(userId);
            if (user && user.is_admin === 0) {
                return next(); // Allow non-admin users to proceed
            } else {
                return res.redirect('/admin/dashboard'); // Redirect admin users to admin dashboard
            }
        } else {
            return res.redirect('/user/login'); // Redirect to user login if not logged in
        }
    } catch (error) {
        console.log("Error", error.message);
        return res.redirect('/user/login'); // Redirect to user login if error occurs
    }
}

const isLoggedout = async (req, res, next) => {
    try {
        if (req.session && req.session.passport && req.session.passport.user) {
            return res.redirect('/user/index');
        } else {
            return next();
        }
    } catch (error) {
        console.log("Error", error.message);
        return res.redirect('/user/login'); // Redirect to user login if error occurs
    }
}

module.exports = {
    isLoggedin,
    isLoggedout
};
