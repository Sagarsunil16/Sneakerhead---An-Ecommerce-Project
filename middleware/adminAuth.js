const User = require('../models/user');

const isLoggedin = async (req, res, next) => {
    try {
        if (req.session.passport) {
            const userId = req.session.passport.user;
            console.log(userId);
            const user = await User.findById(userId);
            if (user) {
                if (user.is_admin === 1) {
                    next(); // Allow admin users to proceed
                } else {
                    res.redirect('/user/index'); // Redirect non-admin users to user index page
                }
            } else {
                res.redirect('/admin/login'); // Redirect to admin login if user not found
            }
        } else {
            res.redirect('/admin/login'); // Redirect to admin login if not logged in
        }
    } catch (error) {
        console.log("Error", error.message);
        res.redirect('/admin/login'); // Redirect to admin login if error occurs
    }
}

const isLoggedout = async (req, res, next) => {
    try {
        if (req.session.passport) {
            res.redirect('/admin/home');
        } else {
            next();
        }
    } catch (error) {
        console.log("Error abc", error.message);
    }
}

module.exports = {
    isLoggedin,
    isLoggedout
};
