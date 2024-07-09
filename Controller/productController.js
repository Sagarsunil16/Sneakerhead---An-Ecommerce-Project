const ProductModel = require("../models/product")
const CategoryModel = require("../models/category")
const OrderModel = require('../models/order');
const Product = require("../models/product");
const Review = require("../models/review")
const User = require("../models/user")


const loadProduct = async (req, res) => {
    try {
        let query = {};
        let page = parseInt(req.query.page) || 1
        const limit = 8
        const totalProduct = await Product.countDocuments({})
        const totalPages = Math.ceil(totalProduct / limit)
        const skip = (page - 1) * limit
        if (req.query.items) { // Corrected typo
            const searchQuery = req.query.items;
            const SearchCondition = {
                $or: [
                    { brand: { $regex: searchQuery, $options: 'i' } }, // Search by brand name (case-insensitive)
                    { description: { $regex: searchQuery, $options: 'i' } }, // Search by description (case-insensitive)
                    { name: { $regex: searchQuery, $options: 'i' } }, // Search by product name (case-insensitive)
                ]
            };

            // Set the query to the search condition
            query = SearchCondition; // Corrected assignment
        }
        const productDetails = await ProductModel.find(query).populate('category').skip(skip).limit(limit);
        const categoryDetails = await CategoryModel.find();
        res.render('addProduct', { product: productDetails, category: categoryDetails, totalPages: totalPages, currentPage: page });
    } catch (error) {
        console.log("Error while loading Products", error.message);
    }
};

const loadaddProduct = async (req, res) => {
    try {
        const categoryData = await CategoryModel.find()
        res.render('product', { category: categoryData })
    } catch (error) {
        console.log("Error while rendering add Product page", error.message)
    }
}

const addProduct = async (req, res) => {
    try {
        // Prepare images array from uploaded files
        const images = req.files ? req.files.map(file => file.filename) : []
        const sizes = req.body.sizes;

        const product = new ProductModel({
            name: req.body.name,
            brand: req.body.brand,
            size: sizes,
            description: req.body.description,
            images: images,
            countInStock: req.body.stock,
            category: req.body.category,
            price: req.body.price,
            discountPrice: req.body.discountPrice
        })

        const savedProduct = await product.save()

        const categoryDetails = await CategoryModel.find()

        if (savedProduct) {
            res.redirect('/admin/product')
        } else {
            res.render('product', { category: categoryDetails, message: "Error while saving the product" })
        }
    } catch (error) {
        console.log("Error while saving the product", error.message);
        res.status(500).send("Error Saving Product")
    }
}

const activeStatus = async (req, res) => {
    try {
        const { id, action } = req.query

        if (action === "Inactive") {
            await ProductModel.findByIdAndUpdate(id, { is_deleted: false })
        }
        else {
            await ProductModel.findByIdAndUpdate(id, { is_deleted: true })
        }
        res.redirect('/admin/product')

    } catch (error) {
        console.log("Error while updating status", error.message)
    }
}
const loadEdit = async (req, res) => {
    try {

        const ProductId = req.query.id
        const orderData = await OrderModel.find({})

        const ExistingOrder = orderData.find(order => order.items.some(item => item.productId == ProductId))
        if (ExistingOrder) {
            res.status(404).json({ message: "You cannot change the details" })
        } else {
            const id = req.query.id
            const ProductData = await ProductModel.findById(id).populate("category")

            if (req.query.delete) {
                ProductData.images = ProductData.images.filter(img => img.trim() !== req.query.delete.trim())
                await ProductData.save()
            }

            const CategoryData = await CategoryModel.find({ is_Active: true })

            res.render("editproduct", { CategoryData, ProductData })
        }

    } catch (error) {
        console.log("Error while loading the product edit Page", error.message)
        res.status(500).send("An error occured")
    }
}
const editProduct = async (req, res) => {
    try {
        let existingImages = []
        let existingProduct = await ProductModel.findById(req.query.id)
        const categoryDetails = await CategoryModel.find({ is_Active: true })

        if (existingProduct && existingProduct.images && Array.isArray(existingProduct.images)) {
            existingImages = existingProduct.images
        }
        let newImages = []
        if (req.files && req.files.length) {
            newImages = req.files.map(file => file.filename)
        }

        const allImages = existingImages.concat(newImages)

        if (allImages.length > 3) {
            return res.render('editproduct', { CategoryData: categoryDetails, ProductData: existingProduct, message: "Maximum 3 Images per Product" })
        } else {
            const id = req.query.id
            const updateProduct = await ProductModel.findByIdAndUpdate({ _id: req.query.id }, {
                $set: {
                    name: req.body.name,
                    brand: req.body.brand,
                    description: req.body.description,
                    price: req.body.price,
                    discountPrice: req.body.discountPrice,
                    countInStock: req.body.stock,
                    category: req.body.category,
                    images: allImages,
                    size: req.body.sizes

                }
            }, { new: true })
            if (updateProduct) {
                res.redirect('/admin/product')
            }
        }

    } catch (error) {
        console.log("Error while editing the Updating the Product Details", error.message)
        res.status(500).send("An Error Occured")
    }
}

const loadIndividualProduct = async (req, res) => {
    try {
        const id = req.query.id
        const Userid = req.session.passport? req.session.passport.user:undefined
        const ProductData = await ProductModel.findById(id).populate('category')
        const review = await Review.find({ product: id }).populate({ path: "user", model: "User" })
        let totalRating = 0
        for (let i = 0; i < review.length; i++) {
            totalRating += review[i].rating
        }
        const averageRating = (review.length > 0) ? (totalRating / review.length) : 0
        const relatedProduct = await ProductModel.find({ category: ProductData.category, is_deleted: false }).limit(4)
        ProductData.rating = averageRating
        await ProductData.save()

        if (ProductData) {
            res.render("shop-details", {
                user_id: Userid,
                product: ProductData,
                category: ProductData.category.name,
                relatedProduct,
                review
            })
        }
        else {
            res.redirect('/user/shop')
        }
    } catch (error) {
        console.log("Error while rendering the Individual Product page", error.message)
        res.status(500).send("An error occured")
    }
}
const submitReview = async (req, res) => {
    try {
        const { reviewText, productId, rating } = req.body
        const userData = await User.findById(req.session.passport.user)
        let review = await Review.findOne({ product: productId, user: userData._id })
        if (!review) {
            review = new Review({
                user: userData._id,
                product: productId,
                rating: rating,
                reviewText: reviewText
            })
        }


        review.rating = rating,
            review.reviewText = reviewText
        await review.save()

        return res.status(200).json({ message: "Submitted" })
    } catch (error) {
        console.log("Error whle submitting the review", error.message)
    }
}


module.exports = {
    loadProduct,
    addProduct,
    activeStatus,
    loadEdit,
    editProduct,
    loadIndividualProduct,
    loadaddProduct,
    submitReview
}