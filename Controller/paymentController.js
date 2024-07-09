const Razorpay = require('razorpay');
const Cart = require("../models/cart")
const crypto = require('crypto');
const Order = require('../models/order');
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

async function getAmount(body, id) {
    if (body.id) {
        const reOrder = await Order.findById(body.id)
        return amount = reOrder.billTotal * 100
    } else {
        const cart = await Cart.findOne({ owner: id })
        return amount = cart.billTotal * 100
    }
}
// Create Order Handler
const createOrder = async (req, res) => {
    try {
        const id = req.session.passport.user;

        const amount = await getAmount(req.body, id)
        // Razorpay order creation options
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: "receipt#1"
        };

        // Creating order with Razorpay
        razorpayInstance.orders.create(options, (err, order) => {
            if (err) {
                console.error("Razorpay order creation error:", err);
                return res.status(400).json({ success: false, msg: "Something went wrong!" });
            }

            // Responding with order details if order creation is successful
            res.status(200).json({
                success: true,
                msg: "Order Created",
                order_id: order.id, // Razorpay order id
                amount: amount,
            });
        });
    } catch (error) {
        console.error("Error while performing the Razorpay payment method", error.message);
        res.status(500).json({ success: false, msg: "Internal Server Error" });
    }
};

const verifyPayment = function (orderId, paymentId, razorpaySignature) {
    try {
        const message = `${orderId}|${paymentId}`
        const generateSignature = crypto.createHmac('sha256', RAZORPAY_SECRET_KEY).update(message).digest('hex')
        return generateSignature === razorpaySignature
    } catch (error) {
        console.log("Error while verifying the payment", error.message)
    }
}


module.exports = {
    createOrder,
    verifyPayment
};
