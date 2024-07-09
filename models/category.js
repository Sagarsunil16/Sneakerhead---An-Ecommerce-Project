const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    description: {
        type: String,
        required: true,
        trim: true
    },

    is_Active: {
        type: Boolean,
        default: true
    }
})

const Category = mongoose.model("category", CategorySchema)

module.exports = Category