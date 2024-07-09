const Coupon = require("../models/coupon")
const Cart = require("../models/cart")

const loadCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.find({})
        res.render("coupon", { coupon })
    } catch (error) {
        console.log("Error while rendering the coupon page", error.message)
        res.status(500).send({ message: "Interal server Error" })
    }
}

const loadCreateCoupon = async (req, res) => {
    try {
        res.render("createCoupon")
    } catch (error) {
        console.log("Error while rendering the Create coupon Page", error.message)
    }
}

const createCoupon = async (req, res) => {
    try {
        const {
            name,
            code,
            description,
            discountPercentage,
            minPurchaseAmount,
            maxPurchaseAmount,
            expirationDate,
            maxUsers,
        } = req.body
        const couponCreate = new Coupon({
            name: name,
            code: code,
            description: description,
            minimumAmount: minPurchaseAmount,
            maximumAmount: maxPurchaseAmount,
            discountPercentage: discountPercentage,
            expirationDate: expirationDate,
            maxUsers: maxUsers

        })

        await couponCreate.save()
        res.status(200).send({ success: true, message: "Coupon created successfully" })

    } catch (error) {
        console.log("Error while creating the coupon", error.message)
    }
}

const toggleCoupon = async (req, res) => {
    try {
        const { couponId, isActive } = req.body
        const updateCoupon = await Coupon.findByIdAndUpdate(couponId, { isActive: isActive })
        updateCoupon.save()
        res.status(200).json({ success: true, message: "Coupon status toggled successfully." })
    } catch (error) {
        console.log("Error while toggling the button", error.message)
        res.status(500).json({ success: false, message: "Failed to toggle coupon status." });
    }
}

const applyCoupon = async (req, res) => {
    try {
        const userCart = await Cart.findOne({ owner: req.session.passport.user })
        const couponCode = req.body.couponCode.toUpperCase()

        if (!userCart || !userCart.items.length) {
            return res.status(400).json({ success: false, message: "Your cart is empty and cannot add Coupon" })
        }
        if (userCart.isApplied === true) {
            return res.status(400).json({ success: false, message: "A coupon is already applied to you Cart" })
        }
        const coupon = await Coupon.findOne({ code: couponCode, isActive: true })
        const userId = (req.session.passport.user).toString()
        const match = coupon.usersUsed.some((id) => id.toString() === userId)
        if (!coupon || match) {
            return res.status(400).json({ success: false, message: "Coupon not found or Already Used" })
        }

        if (userCart.billTotal < coupon.minimumAmount) {
            return res.status(400).json({ success: false, message: "You are not eligible for this CouponCode" })
        }

        const discountAmount = userCart.billTotal * (coupon.discountPercentage / 100)
        userCart.discountPrice = userCart.billTotal - discountAmount
        userCart.billTotal = userCart.billTotal - discountAmount
        userCart.coupon = couponCode,
            userCart.isApplied = true,

            await userCart.save()
        res.status(200).json({ success: true, newTotal: userCart.discountPrice, appliedCoupon: couponCode, message: "Coupon applied Successfully" })
    } catch (error) {
        console.log("Error while applying the coupon", error.message)
    }
}


const removeCoupon = async (req, res) => {
    try {
        let couponCode = req.body.coupon
        const userCart = await Cart.findOne({ owner: req.session.passport.user })
        if (!userCart || !userCart.isApplied) {
            return res.status(400).send({ message: "No coupon is applied to your cart." });
        }
        const coupon = await Coupon.findOne({ code: couponCode })

        if (coupon) {
            userCart.isApplied = false,
                userCart.billTotal = userCart.discountPrice / (1 - (coupon.discountPercentage / 100))
            userCart.coupon = null
            userCart.discountPrice = 0

            await userCart.save()
            res.status(200).json({ success: true, message: "Removed Coupon Successfully" })

        }
    } catch (error) {
        console.log("Error while removing the coupon", error.message)
    }
}
module.exports = {
    loadCoupon,
    loadCreateCoupon,
    createCoupon,
    toggleCoupon,
    applyCoupon,
    removeCoupon
}