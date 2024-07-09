const mongoose = require("mongoose")
const ObjectId = mongoose.Schema.Types.ObjectId

const walletSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: "user"
    },
    balance: {
        type: Number
    },
    order: [{
        type: ObjectId,
        ref: "order"
    }]
})

const Wallet = mongoose.model("wallet", walletSchema)

module.exports = Wallet