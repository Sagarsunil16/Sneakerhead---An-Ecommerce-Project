const express = require('express');
const router = express();
const userController = require('../Controller/userController')
const productController = require('../Controller/productController')
const cartController = require('../Controller/cartController')
const checkoutController = require('../Controller/checkoutController')
const paymentController = require('../Controller/paymentController')
const wishlistController = require("../Controller/wishlistController")
const couponController = require('../Controller/couponController')
const passwordController = require("../Controller/passwordController")
const userAuth = require('../middleware/userAuth')
const path = require('path')

router.set('views', path.join(__dirname, '../views/user'));
router.set('view engine', 'ejs');
router.use(express.static(path.join(__dirname, '../public/user')));


// Add cache control middleware to prevent caching
router.use((req, res, next) => {
    // Set Cache-Control header to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});


//login and register
router.get('/', userAuth.isLoggedout, userController.loadHomepage)
router.get('/user/index', userController.loadHomepage)
router.get('/user/login', userAuth.isLoggedout, userController.loadLogin)
router.post('/user/login', userAuth.isLoggedout, userController.verifyLogin)
router.get('/user/verifyOTP', userAuth.isLoggedout, userAuth.isLoggedout, userController.loadOtp);
router.post('/user/verifyOTP', userAuth.isLoggedout, userController.getOtp);
router.post('/user/resendOTP', userAuth.isLoggedout, userController.resendOtp);
router.get('/user/verify-email', userAuth.isLoggedout, userController.verifyEmail)
router.post('/user/verify-email', userAuth.isLoggedout, userController.verifyEmail)
router.get('/user/register', userAuth.isLoggedout, userController.loadRegister)
router.post('/user/register', userAuth.isLoggedout, userController.insertUser)

//forgetPassword
router.get('/user/forgot-password', userAuth.isLoggedout, userController.loadForgotPassword)
router.post('/user/forgot-password', userAuth.isLoggedout, passwordController.forgotPassword)
router.get("/user/changeForgotPassword", userAuth.isLoggedout, passwordController.loadChangeForgotPassword)
router.post("/user/changeForgotPassword", userAuth.isLoggedout, passwordController.changeForgotPassword)

//profile
router.get('/user/profile', userAuth.isLoggedin, userController.loadUserProfile)
router.post('/user/profile',userAuth.isLoggedin, userController.editProfile)

//profile-address
router.get('/user/addAddress', userAuth.isLoggedin, userController.loadAddAddress)
router.post('/user/addAddress',userAuth.isLoggedin, userController.addAddress)
router.get('/user/editaddress', userAuth.isLoggedin, userController.loadeditAddress)
router.post('/user/editaddress',userAuth.isLoggedin, userController.editAddress)
router.get('/user/deleteaddress', userAuth.isLoggedin, userController.deleteAddress)

//profile-password
router.get('/user/changePassword', userAuth.isLoggedin, userController.loadChangePassword)
router.post('/user/changePassword', userAuth.isLoggedin, userController.changePassword)

//profile-refferal
router.post("/user/addToWallet", userAuth.isLoggedin, userController.addToWallet)

//profile-orders
router.get('/user/orderdetails', userAuth.isLoggedin, checkoutController.loadorderdetails)
router.post('/user/orderdetails', userAuth.isLoggedin, checkoutController.cancelOrder)
router.post('/user/return', userAuth.isLoggedin, checkoutController.returnOrder)
router.get("/user/loadInvoice", userAuth.isLoggedin, checkoutController.loadInvoice)
router.get('/pdf', userAuth.isLoggedin, checkoutController.invoice);

//shop
router.get('/user/shop', userController.loadShop)
router.get('/user/search', userController.loadSearch)

//productDetails
router.get('/user/productDetails', productController.loadIndividualProduct)
router.post('/user/submit-review', userAuth.isLoggedin, productController.submitReview)

//cart
router.get('/user/cart', userAuth.isLoggedin, cartController.loadAndShowCart)
router.post('/user/add-to-cart',userAuth.isLoggedin, cartController.addTocart)
router.post("/user/increaseQty",userAuth.isLoggedin, cartController.increaseQuantity)
router.post("/user/decreaseQty",userAuth.isLoggedin, cartController.decreaseQuantity)
router.post("/user/deleteItem",userAuth.isLoggedin, cartController.deleteItem)
router.post('/user/applycoupon',userAuth.isLoggedin, userAuth.isLoggedin, couponController.applyCoupon)
router.post('/user/removecoupon',userAuth.isLoggedin, userAuth.isLoggedin, couponController.removeCoupon)

//checkout 
router.get('/user/checkout', userAuth.isLoggedin, checkoutController.loadcheckout)
router.post('/user/checkout', checkoutController.PostCheckout)
router.post('/user/createOrder', userAuth.isLoggedin, paymentController.createOrder)
router.patch("/user/checkout", userAuth.isLoggedin, checkoutController.repayment)
router.get('/user/orderconfirmed', userAuth.isLoggedin, checkoutController.loadorderconfirmed)

//wishlist
router.get('/user/wishlist', userAuth.isLoggedin, wishlistController.loadWishlist)
router.post('/user/addToWishlist',userAuth.isLoggedin, wishlistController.addToWishilist)
router.post('/user/deleteFromWishlist',userAuth.isLoggedin, wishlistController.deleteItem)


//contact page
router.get('/user/contact', userController.loadContactUs)

//logout
router.get('/user/logout', userAuth.isLoggedin, userController.logout)

// router.get('/*',(req,res)=>{
//     res.render('index')
// })


module.exports = router;
