const User = require('../models/user')
const bcrypt = require('bcrypt')
const Category = require('../models/category')
const Product = require('../models/product')
const Order = require('../models/order')
const Wallet = require("../models/wallet")
const bestSelling = require("./sellingController")

const loadLogin = async (req, res) => {
    try {
        res.render('adminLogin')
    } catch (error) {
        console.log("Error while rendering the admin login page", error.message)
    }
}

const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/admin/login')
    } catch (error) {
        console.log("Error while Logging out", error.message)
    }
}

const verifyAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.render('adminLogin', { message: "Email and Password are required." });
        }

        const userData = await User.findOne({ email: email });

        if (!userData) {
            return res.render('adminLogin', { message: "Email and Password is incorrect." });
        }

        // Ensure userData.password is defined before comparing
        if (!userData.password) {
            console.log("Password not set for this user.");
            return res.render('adminLogin', { message: "Email and Password is incorrect." });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (passwordMatch) {
            if (userData.is_admin === 0) {
                return res.render('adminLogin', { message: "Email and Password is incorrect." });
            } else {
                req.session.passport = { user: userData._id };
                console.log("Admin verified, redirecting to /admin/home");
                return res.redirect('/admin/home');
            }
        } else {
            return res.render('adminLogin', { message: "Email and Password is incorrect." });
        }
    } catch (error) {
        console.error("Error while verifying Admin: ", error.message);
        res.status(500).send("Internal Server Error");
    }
};




const loadHome = async (req, res) => {
    try {
        const userData = await User.findById(req.session.passport.user)
        const users = await User.find({})
        const products = await Product.find({})
        const usersCount = await User.find().countDocuments()
        const productsCount = await Product.find().countDocuments()

        const confirmedOrders = await Order.aggregate([
            { $match: { status: "Delivered" } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$billTotal" }

                }
            }
        ]).exec()

        const ordersCount = await Order.find({
            status: "Pending",
        }).countDocuments()

        //bestSelling

        let bestSellingProducts = await bestSelling.getBestSellingProducts()
        let bestSellingBrands = await bestSelling.getBestSellingBrands()
        let bestSellingCategories = await bestSelling.getBestSellingCategories()
        res.render('adminhome',
            {
                users,
                products,
                usersCount,
                ordersCount,
                productsCount,
                bestSellingBrands,
                bestSellingProducts,
                bestSellingCategories,
                totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
                admin: userData,
            }
        )
    } catch (error) {
        console.log("Error whiler rendering admin Home", error.message)
    }
}

const getBestSelling = async (req, res) => {
    try {
        const userData = await User.findById(req.session.passport.user)
        const users = await User.find({})
        const products = await Product.find({})
        const usersCount = await User.find().countDocuments()
        const productsCount = await Product.find().countDocuments()

        const confirmedOrders = await Order.aggregate([
            { $match: { status: "Delivered" } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$billTotal" }

                }
            }
        ]).exec()

        const ordersCount = await Order.find({
            status: "Pending",
        }).countDocuments()

        //bestSelling

        let bestSellingProducts = await bestSelling.getBestSellingProducts()
        let bestSellingBrands = await bestSelling.getBestSellingBrands()
        let bestSellingCategories = await bestSelling.getBestSellingCategories()
        res.render('home2',
            {
                users,
                products,
                usersCount,
                ordersCount,
                productsCount,
                bestSellingBrands,
                bestSellingProducts,
                bestSellingCategories,
                totalRevenue: confirmedOrders[0] ? confirmedOrders[0].totalRevenue : 0,
                admin: userData,
            }
        )
    } catch (error) {
        console.log("Error whiler rendering admin Home", error.message)
    }
}

const getChartData = async (req, res) => {
    try {
        const timeBaseForSalesChart = req.query.salesChart;
        const timeBaseForOrderNoChart = req.query.orderChart;
        const timeBaseForOrderTypeChart = req.query.orderType;
        const timeBaseForCategoryBasedChart = req.query.categoryChart;

        function getDatesAndQueryData(timeBaseForChart, chartType) {
            let startDate, endDate;
            let groupingQuery, sortQuery;

            if (timeBaseForChart === "yearly") {
                startDate = new Date(new Date().getFullYear(), 0, 1);
                endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);

                groupingQuery = {
                    _id: {
                        month: { $month: { $toDate: "$createdAt" } },
                        year: { $year: { $toDate: "$createdAt" } }
                    },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };
                sortQuery = { "_id.year": 1, "_id.month": 1 };
            }

            if (timeBaseForChart === "weekly") {
                startDate = new Date();
                endDate = new Date();

                const timeZoneOffset = startDate.getTimezoneOffset();

                startDate.setDate(startDate.getDate() - 6);
                startDate.setUTCHours(0, 0, 0, 0);
                startDate.setUTCMinutes(startDate.getUTCMinutes() + timeZoneOffset);

                endDate.setUTCHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() + 1);
                endDate.setUTCMinutes(endDate.getUTCMinutes() + timeZoneOffset);

                groupingQuery = {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };

                sortQuery = { _id: 1 };
            }

            if (timeBaseForChart === "daily") {
                startDate = new Date();
                endDate = new Date();

                const timezoneOffset = startDate.getTimezoneOffset();

                startDate.setUTCHours(0, 0, 0, 0);
                endDate.setUTCHours(0, 0, 0, 0);
                endDate.setDate(endDate.getDate() + 1);

                startDate.setUTCMinutes(startDate.getUTCMinutes() + timezoneOffset);
                endDate.setUTCMinutes(endDate.getUTCMinutes() + timezoneOffset);

                groupingQuery = {
                    _id: { $hour: "$createdAt" },
                    totalSales: { $sum: "$billTotal" },
                    totalOrder: { $sum: 1 }
                };

                sortQuery = { "_id.hour": 1 };
            }

            if (chartType === "sales") {
                return { groupingQuery, sortQuery, startDate, endDate };
            } else if (chartType === "orderType") {
                return { startDate, endDate };
            } else if (chartType === "categoryBasedChart") {
                return { startDate, endDate };
            } else if (chartType === "orderNoChart") {
                return { groupingQuery, sortQuery, startDate, endDate };
            }
        }

        const salesChartInfo = getDatesAndQueryData(timeBaseForSalesChart, "sales");
        const orderChartInfo = getDatesAndQueryData(timeBaseForOrderTypeChart, "orderType");
        const categoryBasedChartInfo = getDatesAndQueryData(timeBaseForCategoryBasedChart, "categoryBasedChart");
        const orderNoChartInfo = getDatesAndQueryData(timeBaseForOrderNoChart, "orderNoChart");

        const salesChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: salesChartInfo.startDate, $lte: salesChartInfo.endDate },
                    status: { $nin: ["Canceled", "Failed", "Refunded"] },
                    paymentStatus: { $nin: ["Pending", "Processing", "Canceled", "Returned"] }
                }
            },
            { $group: salesChartInfo.groupingQuery },
            { $sort: salesChartInfo.sortQuery }
        ]).exec();

        const orderNoChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: orderNoChartInfo.startDate, $lte: orderNoChartInfo.endDate },
                    status: { $nin: ["Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Failed", "Refunded", "Cancelled"] }
                }
            },
            { $group: orderNoChartInfo.groupingQuery },
            { $sort: orderNoChartInfo.sortQuery }
        ]).exec();

        const orderChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: orderChartInfo.startDate, $lte: orderChartInfo.endDate },
                    status: { $nin: ["Pending", "Processing", "Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Refunded", "Cancelled", "Failed"] }
                }
            },
            { $group: { _id: "$paymentMethod", totalOrder: { $sum: 1 } } }
        ]).exec();

        const categoryWiseChartData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: categoryBasedChartInfo.startDate, $lte: categoryBasedChartInfo.endDate },
                    status: { $nin: ["Pending", "Processing", "Canceled", "Returned"] },
                    paymentStatus: { $nin: ["Pending", "Failed"] }
                }
            },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $lookup: {
                    from: "categories",
                    localField: "productInfo.category",
                    foreignField: "_id",
                    as: "catInfo"
                }
            },
            { $addFields: { categoryInfo: { $arrayElemAt: ["$catInfo", 0] } } },
            { $addFields: { catName: "$categoryInfo.name" } },
            { $group: { _id: "$catName", count: { $sum: 1 } } }
        ]).exec();

        let saleChartInfo = {
            timeBasis: timeBaseForSalesChart,
            data: salesChartData
        };

        let orderTypeChartInfo = {
            timeBasis: timeBaseForOrderTypeChart,
            data: orderChartData
        };

        let categoryChartInfo = {
            timeBasis: timeBaseForCategoryBasedChart,
            data: categoryWiseChartData
        };

        let orderQuantityChartInfo = {
            timeBasis: timeBaseForOrderNoChart,
            data: orderNoChartData
        };

        return res.status(200).json({
            saleChartInfo,
            orderTypeChartInfo,
            categoryChartInfo,
            orderQuantityChartInfo
        });
    } catch (error) {
        console.log("error while getting chart Data", error.message);
        return res.status(500).json({ error: "Something went wrong" });
    }
};




const listUser = async (req, res) => {
    try {
        const userData = await User.find({ is_admin: 0 })
        res.render('userlist', { users: userData })
    } catch (error) {
        console.log("Error while listing users", error.message)
    }
}

const blockUser = async (req, res) => {
    try {
        const id = req.query.id;
        const userData = await User.findById(id)
        if (userData) {
            userData.blocked = true
            await userData.save()
            res.redirect('/admin/userlist')
        }

    } catch (error) {
        console.log("Error while blocking the user", error.message)
        res.status(500).send("internal server error")
    }
}

const unblockUser = async (req, res) => {
    try {
        const id = req.query.id
        const userData = await User.findById(id)
        if (userData) {
            userData.blocked = false
            await userData.save()

            res.redirect('/admin/userlist')
        }
    } catch (error) {
        console.log('Error while unblocking the user', error.message)
    }
}

const loadCategory = async (req, res) => {
    try {
        const category = await Category.find({})
        res.render('category', { category, message: "" })
    } catch (error) {
        console.log("Error while loading category", error.message)
    }
}

const loadOrder = async (req, res) => {
    try {
        const query = req.query.q ? { 'request.status': 'Pending' } : {}
        const page = parseInt(req.query.page) || 1
        const limit = 5;
        const totalOrder = await Order.countDocuments(query)
        const count = await Order.countDocuments({ 'request.status': 'Pending' });
        const totalPages = Math.ceil(totalOrder / limit)
        const skip = (page - 1) * limit
        const orders = await Order.find(query).populate({ path: 'user', model: "User" }).skip(skip).limit(limit).sort({ createdAt: -1 })
        res.render('orders', { order: orders, currentPage: page, totalPages: totalPages, q: query, count })
    } catch (error) {
        console.log("Error while rendering the order page", error.message)
        res.status(500).send('Internal Server Error');

    }
}

const loadorderdetails = async (req, res) => {
    try {
        const id = req.query.id
        const orders = await Order.findById(id).populate({ path: 'user', model: "User" })
        res.render('adminorderdetails', { orders })
    } catch (error) {

    }
}

const updateorder = async (req, res) => {
    try {

        const { newStatus, orderId } = req.body;
        // Check if the order exists
        const order = await Order.findOne({ oId: orderId });
        if (!order) {
            console.log("Error: Order not found");
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update product count if the status is "Canceled"
        if (newStatus === "Canceled") {
            for (const orderItem of order.items) {
                let product = await Product.findById(orderItem.productId);

                if (product) {
                    product.countInStock += orderItem.quantity;
                    await product.save();
                }
            }
        }


        // Update the order status
        const updateOrder = await Order.findOneAndUpdate(
            { oId: orderId },
            { $set: { status: newStatus } },
            { new: true }
        );

        if (!updateOrder) {
            console.log("Error: Failed to update order status");
            return res.status(500).json({ success: false, message: "Failed to update order status" });
        }

        if (order.paymentMethod === 'Razorpay' || order.paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ user: order.user })
            if (!wallet) {
                wallet = new Wallet({
                    user: order.user,
                    balance: 0,
                    order: order._id

                })
            }
            wallet.balance += order.billTotal
            if (order.paymentMethod === 'Razorpay') {
                wallet.order.push(order._id)
            }
            await wallet.save()
        }
        return res.status(200).json({ success: true, message: "Order status updated successfully", updateOrder });
    } catch (error) {
        console.log("Error while updating the order", error.message);
        return res.status(500).json({ success: false, message: "Error while updating the order" });
    }
};

const requestAccept = async (req, res) => {
    try {
        const { orderId, userId } = req.body;

        const canceledOrder = await Order.findOne({ oId: orderId });
        if (!canceledOrder) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        for (let orderItem of canceledOrder.items) {
            let product = await Product.findById(orderItem.productId).exec();

            if (product) {
                product.countInStock += Number(orderItem.quantity);
                await product.save();
            }
        }

        for (let request of canceledOrder.request) {
            if (request.status === 'Pending') {
                const newStatus = request.type === 'Cancel' ? 'Canceled' : 'Returned';
                const updatedOrder = await Order.findOneAndUpdate(
                    { oId: orderId, 'request._id': request._id }, // Match the specific request by its ID.
                    {
                        $set: {
                            status: newStatus,
                            'request.$.status': 'Accepted' // Update the matched request status.
                        }
                    },
                    { new: true }
                );
                if (!updatedOrder) {
                    return res.status(404).json({ success: false, message: "Failed to update order status" });
                }
            }
        }

        if (canceledOrder.paymentMethod === 'Razorpay' || canceledOrder.paymentMethod === 'wallet') {

            let wallet = await Wallet.findOne({ user: user._id })
            if (!wallet) {
                wallet = new Wallet({
                    user: user._id,
                    balance: 0,
                    order: canceledOrder._id

                })
            }
            wallet.balance += canceledOrder.billTotal
            if (canceledOrder.paymentMethod === 'Razorpay') {
                wallet.order.push(canceledOrder._id)
            }
            await wallet.save()
        }
        return res.status(200).json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.log("Error while accepting the request", error.message);
        return res.status(500).json({ success: false, message: "Error while accepting the request" });
    }
};


const requestCancel = async (req, res) => {
    try {
        const { orderId } = req.body
        const order = await Order.findOne({ oId: orderId })

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" })
        }

        for (const orderItem of order.items) {
            const product = await Product.findById(orderItem.productId)

            if (product && product.countInStock > 0) {
                await product.save()
            }
        }

        const updateOrder = await Order.findOneAndUpdate(
            { oId: orderId },
            { $set: { status: 'Pending', 'request.$[elem].status': 'Rejected' } },
            { new: true, arrayFilters: [{ 'elem.status': 'Pending' }] }
        );

        if (!updateOrder) {

            return res.status(201).json({ success: true, message: 'Order not found' });


        }

        return res.status(200).json({ success: true, message: 'Order status rejected', updateOrder })
    } catch (error) {
        console.log("error while canceling the request", error.message)
    }
}
module.exports = {
    loadLogin,
    verifyAdmin,
    loadHome,
    getBestSelling,
    getChartData,
    logout,
    listUser,
    blockUser,
    unblockUser,
    loadCategory,
    loadOrder,
    loadorderdetails,
    updateorder,
    requestAccept,
    requestCancel


}