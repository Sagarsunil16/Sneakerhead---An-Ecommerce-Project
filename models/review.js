const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId
const reviewSchema = new mongoose.Schema({
    product: {
        type: ObjectId,
        ref: "product",
        require: true
    },
    user: {
        type: ObjectId,
        ref: "user",
        require: true
    },
    rating: {
        type: Number,
        require: true
    },
    reviewText: {
        type: String,
        require: true
    },
},
    {
        timestamps: true
    })

const Review = mongoose.model("review", reviewSchema)

module.exports = Review