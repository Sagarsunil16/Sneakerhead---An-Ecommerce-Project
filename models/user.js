const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    mobile: {
        type: String,
        required: false
    },

    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },

    verified: {
        type: String,
        default: 0
    },
    blocked: {
        type: Boolean,
        default: false
    },

    is_admin: {
        type: Number,
        default: 0,
        required: true
    },
    referralCode: {
        type: String
    },
    successfullReferrals: [{
        username: {
            type: String
        },

        date: {
            type: Date,
            default: Date.now()
        },
        status: {
            type: String
        }
    }],

    referralRewards: {
        type: Number,
        default: 0,
        min: 0
    }

})


UserSchema.methods.verifyPassword = function (password) {
    return bcrypt.compareSync(password, this.password)
}

const User = mongoose.model("User", UserSchema)

module.exports = User