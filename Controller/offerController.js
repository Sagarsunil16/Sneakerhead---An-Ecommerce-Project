const CategoryOffer = require("../models/categoryOffer")
const ProductOffer = require("../models/productOffer")
const Category = require('../models/category')
const Product = require("../models/product")
const { parse } = require("dotenv")
const ObjectId = require("mongoose").Types.ObjectId

const loadCategoryOffer = async (req, res) => {
    try {
        const categoryOfferData = await CategoryOffer.aggregate([
            {
                $lookup: {
                    from: "categories",
                    localField: "categoryOffer.category",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            {
                $unwind: "$categoryDetails"
            }
        ])
        res.render('CategoryOffer', { categoryOfferData })
    } catch (error) {
        console.log("Error while loading the category offers", error.message)
    }
}

const loadaddCategoryOffer = async (req, res) => {
    try {
        const categoryData = await Category.find({ is_Active: true }, { name: 1 }).lean()
        res.render('addCategoryOffer', { categoryData })
    } catch (error) {
        console.log("error while rending add categoryOffer page".error.message)
    }
}

const addCategoryOffer = async (req, res) => {
    try {
        const { name, startingDate, endingDate, category, categoryDiscount } = req.body

        let discount = parseFloat(categoryDiscount)

        if (isNaN(discount)) {
            throw new Error('Invalid Category Discount Value')
        }

        const newCategoryOffer = new CategoryOffer({
            name,
            startingDate,
            endingDate,
            categoryOffer: {
                category,
                discount
            }
        })

        await newCategoryOffer.save()
        res.redirect("/admin/categoryoffer")
    } catch (error) {
        console.log("Error while adding category Offer", error.message)
    }
}

const ToggleCategoryOffer = async (req, res) => {
    try {
        const id = req.body.id
        const categoryOffer = await CategoryOffer.findById(id)
        if (!categoryOffer) {
            return res.status(404).json({ message: "Unable to proceed" })
        }

        if (categoryOffer.is_Active === true) {
            categoryOffer.is_Active = false
        }
        else {
            categoryOffer.is_Active = true
        }

        await categoryOffer.save()
        res.status(200).json({ success: true, message: "Successfully Done" })

    } catch (error) {
        console.log("Error while deleting the category offer", error.message)
    }
}

const loadEditCategory = async (req, res) => {
    try {
        const categoryOfferId = req.query.id
        const categoryId = req.query.catId
        const categoryData = await Category.find({})
        const offerDetails = await CategoryOffer.findById(categoryOfferId)
        res.render('editCategoryOffer', { offerDetails, categoryData })
    } catch (error) {
        console.log("Error while rendering the edit category page", error.message)
    }
}

const editCategoryOffer = async (req, res) => {
    try {
        const { name, startingDate, endingDate, category, categoryDiscount } = req.body
        const id = req.query.id
        const catOffer = await CategoryOffer.findByIdAndUpdate(id,
            {
                $set: {
                    name: name,
                    startingDate: startingDate,
                    endingDate: endingDate,
                    'categoryOffer.category': new ObjectId(category),
                    'categoryOffer.discount': categoryDiscount
                }
            },
            { new: true }
        )

        if (!catOffer) {
            return res.status(404).json({ message: "Category Offer not found" });
        }

        res.redirect("/admin/categoryoffer")

    } catch (error) {
        console.log("Error while editing the category Offer", error.message)
    }
}
const loadProductOffer = async (req, res) => {
    try {
        const productOfferData = await ProductOffer.find({})
        res.render("ProductOffer", { productOfferData })
    } catch (error) {
        console.log("error while loading the product offers", error.message)
    }
}

const loadAddProductOffer = async (req, res) => {
    try {
        const productData = await Product.find({ is_deleted: false }, { name: 1 }).lean()
        res.render("addProductOffer", { productData })
    } catch (error) {
        console.log("Error while loading add product offer page", error.message)
    }
}



const addProductOffer = async (req, res) => {
    try {
        let { name, startingDate, endingDate, products, productDiscount } = req.body
        let productOffer = await ProductOffer.findOne({ name: name })
        let discount = parseFloat(productDiscount)
        if (productOffer) {
            throw new Error("Offer already exist")
            return res.status(404).json({ message: "Offer already Exist" })
        }

        productOffer = new ProductOffer({
            name: name,
            startingDate: startingDate,
            endingDate: endingDate,
            "productOfffer.discount": discount,
            "productOfffer.product": new ObjectId(products)

        })

        await productOffer.save()

        return res.redirect("/admin/productoffer")


    } catch (error) {
        console.log("Erro while adding product offer", error.message)
        res.status(500).json({ message: "internal server issue" })
    }
}

const toggleProductOffer = async (req, res) => {
    try {
        const id = req.body.id
        const productOffer = await ProductOffer.findById(id)
        if (!productOffer) {
            return res.status(404).json({ message: "Product Offer not found" })
        }

        if (productOffer.is_Active) {
            productOffer.is_Active = false
        }
        else {
            productOffer.is_Active = true
        }

        await productOffer.save()
        res.status(200).json({ success: true, message: "Successfully Done" })
    } catch (error) {
        console.log("Errow while toggling the productOffer", error.message)
        res.status(500).json({ message: "Something went wrong" })
    }
}
const loadEditProductOffer = async (req, res) => {
    try {
        const { id, prdId } = req.query
        const prdOfferData = await ProductOffer.findById(id)
        const productData = await Product.find({})

        const thatProduct = await Product.findById(prdId)
        const name = thatProduct.name
        prdOfferData.productOfffer.product.name = name

        for (let i = 0; i < productData.length; i++) {
            const productId = productData[i]._id;

            const offer = await ProductOffer.findOne({ 'productOffer.product': productId });

            if (offer) {
                if (productData[i]._id.toString() === receivedProductId.toString()) {

                    productData[i].offerStatus = false
                } else {
                    productData[i].offerStatus = true
                }

            } else {

                productData[i].offerStatus = false
            }
        }
        res.render("editProductOffer", { prdOfferData, productData })
    } catch (error) {
        console.log("Error while loading edit product offer Page", error.message)
    }
}

const editProductOffer = async (req, res) => {
    try {
        const { name, startingDate, endingDate, product, discount } = req.body
        const id = req.query.id
        const productOfferData = await ProductOffer.findByIdAndUpdate(id, {
            $set: {
                name: name,
                startingDate: startingDate,
                endingDate: endingDate,
                productOfffer: {
                    discount: discount,
                    product: new ObjectId(product)
                }
            }
        }, { new: true })

        if (!productOfferData) {
            return res.status(404).json({ message: "Product offer doesn't exist" })
        }

        res.redirect("/admin/productoffer")
    } catch (error) {
        console.log("Error while editing the product offer details", error.message)
        res.status(500).json({ message: "Internal server issue" })
    }
}

module.exports = {
    loadCategoryOffer,
    loadaddCategoryOffer,
    addCategoryOffer,
    ToggleCategoryOffer,
    loadEditCategory,
    editCategoryOffer,
    loadProductOffer,
    loadAddProductOffer,
    addProductOffer,
    toggleProductOffer,
    loadEditProductOffer,
    editProductOffer

}