const Cart = require('../models/cart')
const Product = require('../models/product')
const ProductOffer = require("../models/productOffer")
const CategoryOffer = require("../models/categoryOffer")
const User = require('../models/user')
const Coupon = require("../models/coupon")
const ObjectId = require("mongoose").Types.ObjectId


const loadAndShowCart = async (req, res) => {
    try {
        const userData = await User.findById(req.session.passport.user)
        const UserId = userData._id
        const userCart = await Cart.findOne({ owner: UserId }).populate({ path: 'items.productId', model: 'Product' })
        const coupon = await Coupon.find({ isActive: true })
        if (!userCart) {
            userCart = null
        }

        res.render('shopping-cart', { user: req.session.passport.user, cart: userCart, coupon: coupon })

    } catch (error) {
        console.log("Error while rendering the cart page", error.message)
        res.status(500).send('Error loading cart');
    }
}

const addTocart = async (req, res) => {
    try {
        const productId = req.body.productId
        const size = req.body.size
        const product = await Product.findById(productId)
        const productOffer = await ProductOffer.findOne({
            'productOfffer.product': new ObjectId(productId),
            startingDate: { $lte: new Date() },
            endingDate: { $gte: new Date() }
        })
        const userData = await User.findById(req.session.passport.user)
        if (!product) {
            return res.status(404).json({ message: "Product is not found" })
        }
        const categoryId = product.category
        const categoryOffer = await CategoryOffer.findOne({
            "categoryOffer.category": new ObjectId(categoryId),
            startingDate: { $lte: new Date() },
            endingDate: { $gte: new Date() }
        })
        if (productOffer || categoryOffer) {
            let offerPrice = 0;

            if (productOffer && categoryOffer) {
                // Both offers are present, compare discounts
                if (productOffer.productOfffer.discount > categoryOffer.categoryOffer.discount) {
                    offerPrice = product.discountPrice * (productOffer.productOfffer.discount / 100);
                } else {
                    offerPrice = product.discountPrice * (categoryOffer.categoryOffer.discount / 100);
                }
            } else if (productOffer) {
                // Only product offer is present
                offerPrice = product.discountPrice * (productOffer.productOfffer.discount / 100);
            } else if (categoryOffer) {
                // Only category offer is present
                offerPrice = product.discountPrice * (categoryOffer.categoryOffer.discount / 100);
            }

            product.discountPrice -= offerPrice;
            product.discountPrice = parseFloat(product.discountPrice.toFixed(2))
        }
        const id = req.session.passport.user
        let userCart = await Cart.findOne({ owner: req.session.passport.user })
        if (!userCart) {
            userCart = new Cart({
                owner: id,
                items: [],
                billTotal: 0
            })
        }

        const exisitingCartItem = userCart.items.find(item => item.productId._id.toString() === productId)
        if (exisitingCartItem) {
            if (exisitingCartItem.quantity < product.countInStock && exisitingCartItem.quantity < 5) {
                exisitingCartItem.quantity += 1
                exisitingCartItem.price = exisitingCartItem.quantity * product.discountPrice
            }
            else if (exisitingCartItem.quantity + 1 > product.countInStock) {
                return res.status(409).json({ message: 'Stock limit exceeds' })
            }
            else {
                return res.status(400).json({ message: "Maximum quantity per person reached" })
            }
        }
        else {
            userCart.items.push({
                productId: productId,
                quantit: 1,
                price: product.discountPrice

            })


        }
        userCart.billTotal = userCart.items.reduce((total, item) => total + item.price, 0)
        userCart.billTotal = Math.round(userCart.billTotal)

        const me = await userCart.save()
        return res.status(200).json({ message: "added to cart" })
       
    } catch (error) {
        console.log("Error while adding items to the cart", error.message)
        return res.status(500).json({ message: "Internal server error" })
    }
}

const increaseQuantity = async (req, res) => {
    try {

        const { productId } = req.body;
        const userId = req.session.passport.user
        const product = await Product.findById(productId)
        const cart = await Cart.findOne({ owner: req.session.passport.user }).populate({ path: 'items.productId', model: 'Product' })
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" })
        }
        const couponCode = cart.coupon || null

        const item = cart.items.find(item => item.productId._id.toString() === productId)
        if (!item) {
            return res.status(404).json({
                message: "product not found in the cart"
            })
        }

        // Check if adding 1 to the quantity would exceed the maximum allowed quantity
        if (item.quantity >= 5) {
            return res.status(404).json({ message: "Maximum quantity reached" })
        }

        // Check if adding 1 to the quantity would exceed the remaining stock
        if (item.quantity + 1 > item.productId.countInStock) {
            return res.status(409).json({ message: "Stock limit exceeded" })
        }
        const productOffer = await ProductOffer.findOne({ 'productOfffer.product': new ObjectId(productId) })
        const coupon = await Coupon.findOne({ code: couponCode })

        const categoryId = product.category
        const categoryOffer = await CategoryOffer.findOne({ "categoryOffer.category": new ObjectId(categoryId) })
        // Determine the discount to apply
        let discount = 0;
        if (productOffer) {
            discount = productOffer.productOfffer.discount;
        } else if (categoryOffer) {
            discount = categoryOffer.categoryOffer.discount;
        }

        const discountedPrice = product.discountPrice - (product.discountPrice * (discount / 100));

        // Increase the quantity by 1
        item.quantity += 1

        // Recalculate the price
        item.price = item.quantity * parseFloat(discountedPrice.toFixed(2));

        //update the billtotal

        cart.billTotal = Math.round(cart.items.reduce((total, item) => total + item.price, 0))

        if (cart.isApplied) {
            const discountAmount = cart.billTotal * (coupon.discountPercentage / 100)
            cart.discountPrice = cart.billTotal - discountAmount;
            cart.billTotal = cart.billTotal - discountAmount
        }
        await cart.save()

        return res.status(200).json({ message: "quantity increased", cart })

    } catch (error) {
        console.log("Error while increasing the quantity", error.message)
    }
}


const decreaseQuantity = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.passport.user
        const product = await Product.findById(productId)
        const cart = await Cart.findOne({ owner: userId }).populate({ path: 'items.productId', model: "Product" })

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" })
        }

        const item = cart.items.find(item => item.productId._id.toString() === productId)

        const couponCode = cart.coupon || null
        const coupon = await Coupon.findOne({ code: couponCode })

        if (!item) {
            return res.status(404).json({ message: "Product not in cart" })
        }

        //decrease the quantity by 1 if its greater than 1

        if (item.quantity > 1) {

            const productOffer = await ProductOffer.findOne({ 'productOfffer.product': new ObjectId(productId) })
            const coupon = await Coupon.findOne({ code: couponCode })

            const categoryId = product.category
            const categoryOffer = await CategoryOffer.findOne({ "categoryOffer.category": new ObjectId(categoryId) })


            let discount = 0;
            if (productOffer) {
                discount = productOffer.productOfffer.discount;
            } else if (categoryOffer) {
                discount = categoryOffer.categoryOffer.discount;
            }

            const discountedPrice = product.discountPrice - (product.discountPrice * (discount / 100));

            item.quantity -= 1
            //recalculate the price 
            item.price = item.quantity * parseFloat(discountedPrice.toFixed(2));
        } else {
            return res.status(404).json({ message: "Minimum quantity reached" })
        }


        // update the billTotal
        cart.billTotal = Math.round(cart.items.reduce((total, item) => total + item.price, 0))
        if (cart.isApplied) {
            const discountAmount = cart.billTotal * (coupon.discountPercentage / 100)
            cart.discountPrice = cart.billTotal - discountAmount;
            cart.billTotal = cart.discountPrice
        }
        await cart.save()
        return res.status(200).json({ message: "quantity decreased", cart })
    } catch (error) {
        console.log("Error while decreasing the quantity of the items", error.message)
    }
}

const deleteItem = async (req, res) => {
    try {
        const { productId } = req.body
        const userId = req.session.passport.user

        const userCart = await Cart.findOne({ owner: userId })

        if (!userCart) {
            return res.status(404).json({ message: "Cart not found" })
        }

        // Find if the product exists in the cart
        const existingCartItemIndex = userCart.items.findIndex(item => item.productId._id.toString() === productId)

        if (existingCartItemIndex > -1) {
            userCart.items.splice(existingCartItemIndex, 1)

            //recalculate the BillTotal 

            userCart.billTotal = userCart.items.reduce((total, item) => {
                let itemPrice = Number(item.price)

                let itemQuantity = Number(item.quantity)

                let itemTotal = itemPrice * itemQuantity

                return total + (isNaN(itemTotal) ? 0 : itemTotal)
            }, 0);


            await userCart.save()
            return res.status(200).json({ success: true, message: "Item removed from cart" })
        }
        else {
            return res.status(404).json({ message: "Item not found in the cart" })
        }

    } catch (error) {
        console.log("Error while deleting the items from the cart", error.message)
        res.status(500).json({ message: "Internal server Error" })
    }
}


module.exports = {
    loadAndShowCart,
    addTocart,
    increaseQuantity,
    decreaseQuantity,
    deleteItem
}