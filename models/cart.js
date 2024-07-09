const mongoose = require('mongoose')
const ObjectID = mongoose.Schema.Types.ObjectId

const cartSchema = new mongoose.Schema({
    owner: {
        type: ObjectID,
        ref: 'users',
        required: true
    },

    items: [{
        productId: {
            type: ObjectID,
            ref: 'products',
            required: true

        },

        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity cannot be less than one'],
            default: 1
        },
        price: {
            type: Number
        },
        selected: {
            type: Boolean,
            default: false
        }
    }],

    billTotal: {
        type: Number,
        required: true,
        default: 0
    },

    shipping: {
        type: Number,
        default: 0
    },

    isApplied: {
        type: Boolean,
        default: false
    },

    coupon: {
        type: String,
        default: null
    },
    discountPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

const Cart = mongoose.model('cart', cartSchema)

module.exports = Cart