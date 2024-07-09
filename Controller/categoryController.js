
const { EventEmitterAsyncResource } = require('nodemailer/lib/xoauth2');
const Category = require('../models/category')

const createCategory = async (req, res) => {
    try {
        const name = req.body.name;
        const dis = req.body.description;
        const existingcat = await Category.findOne({

            name: name.toLowerCase()
        })
        if (existingcat) {
            const categoryDetails = await Category.find()
            return res.render('category', { category: categoryDetails, message: "Category already exists" })
        }
        else {

            const cat = new Category({
                name: name.toLowerCase(),
                description: dis
            })

            const catData = await cat.save()
            return res.redirect('/admin/category')
        }
    } catch (error) {
        console.log("Error while creating Category", error.message)
    }
}

const editCategoryLoad = async (req, res) => {
    try {
        const id = req.query.id

        const categoryData = Category.findById(id)

        if (categoryData) {
            res.render('edit-cate', { category: categoryData })
        }
        else {

            res.redirect('/admin/category')
        }
    } catch (error) {
        console.log("Error wgile editing category", error.message)

        res.status(500).send('Internal Server Error');
    }
}

const updateCate = async (req, res) => {

    try {
        const id = req.query.id
        const Data = await Category.findByIdAndUpdate(id, { $set: { name: req.body.name, description: req.body.description } })
        if (Data) {
            res.redirect("/admin/category")
        }
    }

    catch (error) {
        console.log("Error while Updting the category", error.message)
    }
}

const deleteCate = async (req, res) => {
    try {
        const id = req.query.id
        const category = await Category.findById(id);
        if (category.is_Active === true) {
            await Category.findByIdAndUpdate(id, { is_Active: false })
        }
        else {
            await Category.findByIdAndUpdate(id, { is_Active: true })
        }

        res.redirect('/admin/category')

    } catch (error) {
        console.log("Error while soft deleting the category", error.message)
        res.status(500).send("Internal Server Error")
    }
}



module.exports = {
    createCategory,
    editCategoryLoad,
    updateCate,
    deleteCate,

}