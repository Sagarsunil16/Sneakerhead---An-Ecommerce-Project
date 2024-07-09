const Cart = require('../models/cart')
const Product = require('../models/product')
const Address = require('../models/address')
const User = require('../models/user')
const Order = require('../models/order')
const Coupon = require("../models/coupon")
const Wallet = require("../models/wallet")
const { createInvoice } = require('../easyInvoiceWrapper');
const paymentController = require('../Controller/paymentController')
const randomstring = require("randomstring");

const loadcheckout = async (req, res) => {
    try {



        let address = await Address.findOne({ user: req.session.passport.user }) || null

        const cart = await Cart.findOne({ owner: req.session.passport.user }).populate({ path: 'items.productId', model: 'Product' }) || null

        const user = await User.findById(req.session.passport.user)

        // Check if the cart is empty
        if (!cart || !cart.items || cart.items.length === 0) {
            // If cart is empty, redirect or return an error message
            return res.status(400).json({ message: "Cart is empty" });
            // Alternatively, you can redirect the user to another page
            // return res.redirect('/cart');
        }

        res.render('checkout', { user, address, cart })
    } catch (error) {
        console.log("Error while loading checkout page", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}
async function generateUniqueOrderID() {
    const randomPart = randomstring.generate({
        length: 6,
        charset: 'numeric'
    })

    const currentDate = new Date()

    const datePart = currentDate.toISOString().slice(0, 10).replace(/-/g, "");

    const orderID = `ID_${randomPart}${datePart}`

    return orderID
}

function checkPayment(body) {
    if (body.response != null) {
        const isValid = paymentController.verifyPayment(body.response.razorpay_order_id, body.response.razorpay_payment_id, body.response.razorpay_signature)
        if (isValid) {

            return {
                paymentOption: 'Razorpay',
                address: body.data.addressType
            }
        }
        else {
            return {
                paymentOption: null,
                address: null
            }
        }
    } else if (body.error != null) {
        return {
            paymentOption: 'Razorpay failed',
            address: body.data.addressType
        }
    } else {
        return {
            paymentOption: body.paymentOption,
            address: body.addressType
        }


    }


}
const PostCheckout = async (req, res) => {
    try {

        const { paymentOption, address } = checkPayment(req.body)
        const cart = await Cart.findOne({ owner: req.session.passport.user }).populate({ path: 'items.productId', model: 'Product' })
        const amount = Math.round(cart.billTotal)
        if (paymentOption === "COD" && amount > 10000) {
            return res.status(404).json({ message: "Cash on deleivery is not available for this order" })
        }
        if (paymentOption === null || !paymentOption) {
            return res.status(400).json({ message: "Payment error" })
        }
        if (!address) {
            return res.status(400)
        }

        const user = await User.findById(req.session.passport.user)

        const wallet = await Wallet.findOne({ user: user._id })

        if (paymentOption === "wallet") {
            if (wallet.balance < amount) {
                return res.status(404).json({ message: "Insucfficient funds" })
            }
            wallet.balance -= amount
        }



        if (!cart) {
            return res.status(400).json({ message: "Cart not found" })
        }

        const orderAddress = await Address.findOne({ user: user._id })
        if (!orderAddress) {
            return res.status(400).json({ message: "Address not found" })
        }

        const addressdetails = orderAddress.addresses.find((item) => item.addressType === address)

        if (!addressdetails) {
            return res.status(400).json({

                message: "Invalid address ID"
            })
        }

        const selectedItems = cart.items

        for (const item of selectedItems) {
            const product = await Product.findOne({ _id: item.productId })

            if (product.countInStock === 0) {
                return res.status(400).json({
                    message: "product out of stock"
                })
            }

            if (product.countInStock >= item.quantity) {
                product.countInStock -= item.quantity

                await product.save()
            } else {

                return res.status(404).json({ message: "Not Enough Stocks Left" })
            }
        }

        const order_id = await generateUniqueOrderID()

        const orderData = new Order({
            user: user._id,
            cart: cart._id,
            billTotal: cart.billTotal,
            oId: order_id,
            paymentStatus: "Success",
            paymentMethod: paymentOption,
            deliveryAddress: addressdetails,
            coupon: cart.coupon,
            discountPrice: cart.discountPrice
        });

        for (const item of selectedItems) {
            orderData.items.push({
                productId: item.productId._id,
                image: item.productId.images[0],
                name: item.productId.name,
                productPrice: item.productId.price,
                quantity: item.quantity,
                price: item.price
            })
        }

        if (cart.isApplied) {
            const coup = cart.coupon;
            await Coupon.updateOne({ code: coup }, {
                $push: { usersUsed: user._id }, $inc: {
                    maxUsers: -1
                }
            })
            cart.isApplied = false
            cart.coupon = null
            await cart.save()
        }

        if (paymentOption === 'Razorpay failed') {
            orderData.paymentStatus = "Pending"
        }
        await orderData.save();
        if (orderData.paymentMethod === "wallet") {
            wallet.order.push(orderData._id)
            await wallet.save()
        }


        cart.items = []
        cart.isApplied = false;
        await cart.save()

        res.status(200).json({ order_id })

    } catch (error) {
        console.log('Post checkout error:', error.message);
        res.status(500).json({ message: "Internal server error" });
        res.redirect('/home');
    }
}


const repayment = async (req, res) => {
    try {
        const id = req.body.id
        const isValid = paymentController.verifyPayment(req.body.response.razorpay_order_id, req.body.response.razorpay_payment_id, req.body.response.razorpay_signature)
        if (isValid) {
            const orderData = await Order.findByIdAndUpdate(id, {
                $set: {
                    paymentMethod: "Razorpay",
                    paymentStatus: "Success"
                }
            })

            return res.status(200).json({ message: "Payment success" })
        }
        else {
            return res.status(400).json({ message: "Payment errir" })
        }

    } catch (error) {
        console.log("Error wile repaying the order", error.message)
    }
}
const loadorderconfirmed = async (req, res) => {
    try {
        const orderId = req.query.id;
        const order = await Order.findOne({ oId: orderId })
        if (!order) {
            return res.status(404).json({ message: "No order found" })
        }

        res.render("orderconfirmed", { user: req.session.passport.user, order: order })
    } catch (error) {
        console.log("Error retreiving order details", error.message)
    }
}

const loadorderdetails = async (req, res) => {
    try {
        const orderId = req.query.id
        const order = await Order.findOne({ _id: orderId }).populate({path:'items.productId',model:'Product'})
        res.render('orderdetails', { user_id: req.session.passport.user, order })
    } catch (error) {
        console.log("Error while loading order details", error.message)
    }
}

const cancelOrder = async (req, res) => {
    try {

        const id = req.query.id
        const { reason, oId } = req.body
        const userData = await User.findById(req.session.passport.user)
        if (!reason || !oId) {
            return res.status(400).json({ success: false, error: "Reason and orderId are required" })
        }

        const order = await Order.findOne({ oId: oId })

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" })
        }

        for (const orderItem of order.items) {
            const product = await Product.findById(orderItem.productId)
            if (!product) {
                return res.status(404).json({ message: "Product not found" })
            }
            else {
                product.countInStock += orderItem.quantity
                await product.save()
            }

            const updateOrder = await Order.findOneAndUpdate({ oId: oId },
                {
                    $set: {
                        status: "Canceled"
                    }
                }
                , { new: true })


        }

        if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'wallet') {

            let wallet = await Wallet.findOne({ user: userData._id })
            if (!wallet) {
                wallet = new Wallet({
                    user: userData._id,
                    balance: 0,
                    order: order._id

                })
            }
            wallet.balance += order.billTotal
            if (order.paymentMethod === 'Razorpay') {
                wallet.order.push(order._id)
            }
            await wallet.save()
        }





        res.json({ success: true, message: "Order canceled successfully" })

    } catch (error) {
        console.log("Error while cancelling the order", error.message)
    }
}
const returnOrder = async (req, res) => {
    try {
        const { reason, oId } = req.body
        if (!reason || !oId) {
            return res.status(400).json({ success: false, error: "Reason and orderId are required" });
        }

        const order = await Order.findOne({ oId });

        if (!order) {
            return res.status(404).json({ success: false, error: "Order not found" });
        }

        if (order.status !== 'Delivered') {
            return res.status(400).json({ success: false, error: "Cannot return order. Order is not delivered yet." });
        }

        const newReturnRequest = {
            type: 'Return',
            status: 'Pending',
            reason: reason
        }

        order.request.push(newReturnRequest)
        await order.save()


        res.json({ success: true, message: "Return request submitted successfully" });
    } catch (error) {
        console.error("returnOrder error:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
}

const loadInvoice = async (req, res) => {
    try {
        const id = req.query.id;
        const invoiceId = `MWS-2024-${Math.floor(100000 + Math.random() * 900000)}`;
        const findOrder = await Order.findById({ _id: id })
        const proId = [];

        var user = await User.findOne({ _id: findOrder.user });

        for (let i = 0; i < findOrder.items.length; i++) {
            proId.push(findOrder.items[i].productId);
        }
        const proData = [];

        for (let i = 0; i < proId.length; i++) {
            proData.push(await Product.findById({ _id: proId[i] }));
        }

        const date = new Date().toDateString();
        res.render("invoice", { proData, findOrder, user, invoiceId, date });

    } catch (error) {
        console.log(error.message)
    }
}

const invoice = async (req, res) => {
    try {
        const id = req.query.id;
        const findOrder = await Order.findById({ _id: id }).populate({ path: 'items.productId', model: 'Product' });

        var user = await User.findOne({ _id: findOrder.user });

        if (!findOrder) {
            return res.status(404).send('Order not found');
        }

        let pdttotal = 0;
        for (let i = 0; i < findOrder.items.length; i++) {
            pdttotal += findOrder.items[i].subTotal;
        }
        const discountAmount = (pdttotal * (findOrder.discount / 100)).toFixed(2);
        const discount = findOrder.discount;
        const vatRate = (discount / 100);
        const vatAmount = pdttotal * vatRate;
        const totalWithVAT = pdttotal - vatAmount;
        const data = {
            "documentTitle": "INVOICE",
            "currency": "INR",
            "taxNotation": "gst",
            "marginTop": 25,
            "marginRight": 25,
            "marginLeft": 25,
            "marginBottom": 25,
            "logo": "img/logo2.png",
            "background": "adminassets/imgs/brands/7d02989082b082e58141cce8a7536ee3.jpg",
            "sender": {
                "company": "Sneakerhead",
                "address": "Brototype Hub, Maradu,Kochi,Ernakulam,Kerala",
                "zip": "682028",
                "city": "Kochi",
                "country": "India"
            },
            "client": {
                "company": user.name,
                "address": findOrder.deliveryAddress[0].HouseNo,
                "Landmark": findOrder.deliveryAddress[0].Landmark,
                "district": findOrder.deliveryAddress[0].district,
                "zip": findOrder.deliveryAddress[0].pincode,
                "city": findOrder.deliveryAddress[0].city,
                "country": findOrder.deliveryAddress[0].Country
            },
            "products": findOrder.items.map(item => ({
                "quantity": item.quantity.toString(),
                "description": item.name,
                "price": item.price / item.quantity,
            })),
            "discountApplied": {
                "couponCode": findOrder.coupon
            }
        };

        const result = await createInvoice(data);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=myInvoice.pdf');
        res.send(Buffer.from(result.pdf, 'base64'));
    } catch (error) {
        console.error('Error generating invoice:', error.message);
        res.status(500).send('Error generating invoice');
    }
};

module.exports = {
    loadcheckout,
    generateUniqueOrderID,
    PostCheckout,
    repayment,
    loadorderconfirmed,
    loadorderdetails,
    cancelOrder,
    returnOrder,
    loadInvoice,
    invoice

}