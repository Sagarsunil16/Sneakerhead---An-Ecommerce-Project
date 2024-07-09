const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    code: {
        type: String,
        require: true,
        uppercase: true,
        unique: true
    },
    description: {
        type: String
    },
    minimumAmount: {
        type: Number,
        min: 100,
        require: true
    },
    maximumAmount: {
        type: Number,
        required: true
    },
    discountPercentage: {
        type: Number,
        require: true,
        min: 0,
        max: 100
    },
    expirationDate: {
        type: Date,
        require: true
    },
    isActive: {
        type: Boolean,
        require: true,
        default: true
    },
    usersUsed: [{
        type: String,
    }],
    maxUsers: {
        type: Number,
        default: null
    }
}, { timestamps: true })

const Coupon = mongoose.model("coupon", couponSchema)

module.exports = Coupon