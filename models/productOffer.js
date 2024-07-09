const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const productOfferSchema = new mongoose.Schema({
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
    productOfffer: {
        product: {
            type: ObjectId,
            ref: "product"
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

productOfferSchema.pre("save", function (next) {
    const currentDate = new Date();
    if (currentDate > this.endingDate) {
        this.productOffer.offerStatus = false;
    }
    next();
});

const ProductOfferModel = mongoose.model("productOffer", productOfferSchema)

module.exports = ProductOfferModel