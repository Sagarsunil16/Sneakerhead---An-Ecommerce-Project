
const User = require('../models/user')
const Wishlist = require('../models/wishlist')

const loadWishlist = async (req, res) => {
    try {
        const user = await User.findById(req.session.passport.user)
        const wish = await Wishlist.findOne({ user: user._id }).populate({ path: 'product', model: "Product" })
        res.render("wishlist", { wish })
    } catch (error) {
        console.log("error while rendering the wishlist page", error.message)
    }
}

const addToWishilist = async (req, res) => {
    try {
        const id = req.body.productId

        const userid = req.session.passport.user
        const user = await User.findById(userid)

        let wishlist = await Wishlist.findOne({ user: user._id })
        if (!wishlist) {
            wishlist = new Wishlist({
                user: user._id,
                product: []
            })
        }
        for (const item of wishlist.product) {
            if (item.toString() === id) {
                return res.status(400).send("Item is already in the Wishlist")
            }
        }
        wishlist.product.push(id)


        await wishlist.save()
        res.status(200).send("Product added to wishlist succcessfully")

    } catch (error) {
        console.log("Error while adding items to wishlist", error.message)
        res.status(500).send("Internal server Error")
    }
}

const deleteItem = async (req, res) => {
    try {
        const id = req.body.productId
        const user = await User.findById(req.session.passport.user)
        const wishlist = await Wishlist.findOne({ user: user._id })

        const matchIndex = wishlist.product.findIndex(item => item.toString() === id)

        wishlist.product.splice(matchIndex, 1)
        await wishlist.save()

        res.status(200).send({ message: "Product removed from the Wishlist" })
    } catch (error) {
        console.log("Error while deleting the item from the wishlist", error.message)

    }
}

module.exports = {
    loadWishlist,
    addToWishilist,
    deleteItem
}