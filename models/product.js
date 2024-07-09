const mongoose = require('mongoose')

const ProductScehema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    brand: {
        type: String,
        required: true

    },

    description: {
        type: String,
        required: true
    },

    images: [{
        type: String
    }],

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },

    size: [{
        type: String,
        required: true
    }],
    discountPrice: {
        type: Number,
        default: 0
    },

    countInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    rating: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    is_deleted: {
        type: Boolean,
        default: false
    }
})

const Product = mongoose.model('Product', ProductScehema)

module.exports = Product