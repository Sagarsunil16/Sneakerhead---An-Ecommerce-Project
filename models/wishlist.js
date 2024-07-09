const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId

const wishlistSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: "User",
        required: true
    },

    product: [
        {
            type: ObjectId,
            ref: 'Product'
        }
    ]
})

const Wishlist = mongoose.model("Wishlist", wishlistSchema)

module.exports = Wishlist
