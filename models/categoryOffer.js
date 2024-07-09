const mongoose = require('mongoose');
const ObjectiD = mongoose.Schema.Types.ObjectId

const categoryOfferScehma = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    startingDate: {
        type: Date,
        require: true
    },
    endingDate: {
        type: Date,
        require: true
    },
    categoryOffer: {
        category: {
            type: ObjectiD,
            ref: "category"
        },
        discount: {
            type: Number
        },
        offerStatus: {
            type: Boolean,
            default: true
        }
    },

    is_Active: {
        type: Boolean,
        default: true
    }
})

categoryOfferScehma.pre("save", function (next) {
    const currentDate = new Date()
    if (currentDate > this.endingDate) {
        this.categoryOffer.offerStatus = false
    }
    next()
})

const CategoryOfferModel = mongoose.model("categoryOffer", categoryOfferScehma)

module.exports = CategoryOfferModel