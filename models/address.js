const mongoose = require('mongoose')
const ObjectID = mongoose.Schema.Types.ObjectId;

const addressSchema = new mongoose.Schema({
    user: {
        type: ObjectID,
        ref: 'user',
        required: true
    },

    addresses: [{
        addressType: {
            type: String,// This will store the address type, e.g., 'home' or 'work'
            required: true,
            enum: ['work', 'home', 'temp'] // Define the allowed values for address type
        },
        HouseNo: {
            type: String,
            required: true
        },
        Street: {
            type: String,
            required: true
        },
        Landmark: {
            type: String,
            required: true
        },
        pincode: {
            type: Number,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        State: {
            type: String,
            required: true
        },
        Country: {
            type: String,
            required: true
        }
    }],

})

//  addressSchema.path('address').validate(function (value){
//     return value.length<=3;
// },'You can have a maximum of 3 addresses')

const Address = mongoose.model('Address', addressSchema);
module.exports = Address