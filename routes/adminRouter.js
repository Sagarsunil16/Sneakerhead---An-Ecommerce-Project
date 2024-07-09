const express = require('express');
const router = express();
const adminAuth = require('../middleware/adminAuth')
const adminController = require('../Controller/adminController')
const categoryController = require("../Controller/categoryController")
const productController = require("../Controller/productController")
const couponController = require("../Controller/couponController")
const salesController = require("../Controller/salesController")
const offerController = require("../Controller/offerController")
const path = require('path')
const multer = require('multer')
/* GET home page. */
router.use(express.static("public"))
router.set('view engine', 'ejs');
router.set('views', path.join(__dirname, '../views/admin'));
router.use(express.static("public"))

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/ProductImages')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({ storage: storage }).array("images", 3)


//Admin login
router.get('/login', adminAuth.isLoggedout, adminController.loadLogin)
router.post('/login', adminController.verifyAdmin)

// Admin Dashboard
router.get('/home', adminAuth.isLoggedin, adminController.loadHome)
router.get("/bestselling", adminAuth.isLoggedin, adminController.getBestSelling)
router.get("/chart", adminAuth.isLoggedin, adminController.getChartData);

//Userlist
router.get('/userlist', adminAuth.isLoggedin, adminController.listUser)
router.get('/block-user', adminAuth.isLoggedin, adminController.blockUser)
router.get('/unblock-user', adminAuth.isLoggedin, adminController.unblockUser)

//Category
router.get('/category', adminAuth.isLoggedin, adminController.loadCategory)
router.post('/category', categoryController.createCategory)
router.get('/edit-category', adminAuth.isLoggedin, categoryController.editCategoryLoad)
router.post('/edit-category', categoryController.updateCate)
router.get('/delete-category', adminAuth.isLoggedin, categoryController.deleteCate)

//Product
router.get('/product', adminAuth.isLoggedin, productController.loadProduct)
router.get('/addproduct', adminAuth.isLoggedin, productController.loadaddProduct)
router.post('/Addproduct', upload, productController.addProduct)
router.get('/active', adminAuth.isLoggedin, productController.activeStatus)
router.get('/editproduct', adminAuth.isLoggedin, productController.loadEdit)
router.post('/editproduct', upload, productController.editProduct)

//Orders
router.get('/order', adminAuth.isLoggedin, adminController.loadOrder)
router.get("/adminorderdetails", adminAuth.isLoggedin, adminController.loadorderdetails)
router.post('/acceptcancel', adminController.requestAccept)
router.post('/rejectcancel', adminController.requestCancel)
router.post("/updateorderstatus", adminController.updateorder)

//Coupon
router.get("/coupon", adminAuth.isLoggedin, couponController.loadCoupon)
router.get("/createcoupon", adminAuth.isLoggedin, couponController.loadCreateCoupon)
router.post("/createcoupon", couponController.createCoupon)
router.post("/togglecoupon", couponController.toggleCoupon)

//CategoryOffer
router.get("/categoryoffer", adminAuth.isLoggedin, offerController.loadCategoryOffer)
router.get("/addcategoryoffer", adminAuth.isLoggedin, offerController.loadaddCategoryOffer)
router.post("/addcategoryoffer", adminAuth.isLoggedin, offerController.addCategoryOffer)
router.get("/editcategoryoffer", adminAuth.isLoggedin, offerController.loadEditCategory)
router.post("/editcategoryoffer", adminAuth.isLoggedin, offerController.editCategoryOffer)
router.post("/toggleOffer", adminAuth.isLoggedin, offerController.ToggleCategoryOffer)

//ProductOffer
router.get("/productoffer", adminAuth.isLoggedin, offerController.loadProductOffer)
router.get("/addproductoffer", adminAuth.isLoggedin, offerController.loadAddProductOffer)
router.post("/addproductoffer", adminAuth.isLoggedin, offerController.addProductOffer)
router.get("/editproductoffer", adminAuth.isLoggedin, offerController.loadEditProductOffer)
router.post("/editproductoffer", adminAuth.isLoggedin, offerController.editProductOffer)
router.post("/toggleproductoffer", adminAuth.isLoggedin, offerController.toggleProductOffer)

//salesReport
router.get("/salesreport", adminAuth.isLoggedin, salesController.loadSales)
router.post("/salesReportSelectFilter", adminAuth.isLoggedin, salesController.filterReoprt)
router.post("/fileterDateRange", adminAuth.isLoggedin, salesController.filterCustomDateOrder)


router.get('/logout', adminAuth.isLoggedin, adminController.logout)

module.exports = router;
