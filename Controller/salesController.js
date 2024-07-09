const Order = require("../models/order")
const loadSales = async (req, res) => {
    try {
        let salesData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            { $sort: { orderDate: -1 } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productNew"
                }
            },
            { $unwind: "$productNew" },
            { $match: { status: "Delivered" } },

            {
                $project: {
                    oId: 1,
                    "user.name": 1,
                    "productNew.name": 1,
                    "productNew.price": 1,
                    "productNew.discountPrice": 1,
                    billTotal: 1,
                    orderDate: 1,
                    paymentMethod: 1,
                    coupon: 1,
                    "items.productPrice": 1,
                    status: 1,
                    "items.quantity": 1
                }
            }
        ]);

        let totalRegularPrice = 0;
        let totalSalesPrice = 0;

        for (let i = 0; i < salesData.length; i++) {
            totalRegularPrice += salesData[i].productNew.price * salesData[i].items.quantity
            totalSalesPrice += salesData[i].billTotal
        }

        let totalDiscountPrice = totalRegularPrice - totalSalesPrice

        res.render("salesReport", { salesData, totalSalesPrice, totalRegularPrice, totalDiscountPrice })
    } catch (error) {
        console.log("Error while loading sales page", error.message)
    }
}

const filterReoprt = async (req, res) => {
    try {
        const recievedData = req.body.timePeriod
        let startDate, endDate

        if (recievedData === "week") {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0)
            startDate.setDate(startDate.getDate() - startDate.getDay())

            endDate = new Date()
            endDate.setHours(23, 59, 59, 999)
            endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
        } else if (recievedData === "month") {
            startDate = new Date()
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1)
            endDate.setDate(0)
            endDate.setHours(23, 59, 59, 999)
        } else if (recievedData === "year") {
            startDate = new Date()
            startDate.setMonth(0),
                startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)

            endDate = new Date();
            endDate.setMonth(11);
            endDate.setDate(31);
            endDate.setHours(23, 59, 59, 999)
        } else if (recievedData === "day") {
            let today = new Date()
            today.setHours(0, 0, 0, 0)

            startDate = new Date(today),
                endDate = new Date(today)
            endDate.setDate(today.getDate() + 1)
        } else if (recievedData === 'all') {

        }
        else {
            throw new error('Invalid time Period')
        }

        let salesData;
        if (recievedData === 'all') {

            salesData = await Order.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user"
                    }
                },
                { $unwind: "$user" },
                { $sort: { orderDate: -1 } },
                { $unwind: "$items" },

                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productNew"
                    }
                },
                { $unwind: "$productNew" },
                { $match: { "status": "Delivered" } },
                {
                    $project: {
                        oId: 1,
                        "user.name": 1,
                        "productNew.name": 1,
                        "productNew.price": 1,
                        "productNew.discountPrice": 1,
                        billTotal: 1,
                        orderDate: 1,
                        paymentMethod: 1,
                        coupon: 1,
                        "items.productPrice": 1,
                        "status": 1,
                        "items.quantity": 1
                    }
                }
            ])
        } else {
            salesData = await Order.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "user",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $match: { orderDate: { $gte: startDate, $lte: endDate } } },
                { $unwind: "$user" },
                { $sort: { orderDate: -1 } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.productId",
                        foreignField: "_id",
                        as: "productNew",
                    },
                },
                { $unwind: "$productNew" },
                {
                    $match: { "status": "Delivered" }
                },
                {
                    $project: {
                        oId: 1,
                        "user.name": 1,
                        "productNew.name": 1,
                        "productNew.price": 1,
                        "productNew.discountPrice": 1,
                        billTotal: 1,
                        orderDate: 1,
                        paymentMethod: 1,
                        coupon: 1,
                        "items.productPrice": 1,
                        "status": 1,
                        "items.quantity": 1
                    }
                }
            ]);
        }

        let totalRegularPrice = 0;
        let totalSalesPrice = 0

        for (let i = 0; i < salesData.length; i++) {
            totalRegularPrice += salesData[i].productNew.price * salesData[i].items.quantity
            totalSalesPrice += salesData[i].billTotal
        }

        let totalDiscountPrice = totalRegularPrice - totalSalesPrice

        res.render("salesReport", { salesData, totalDiscountPrice, totalRegularPrice, totalSalesPrice })
    } catch (error) {
        console.log("Error while filtering the report", error.message)
    }
}

const filterCustomDateOrder = async (req, res) => {
    try {
        const { startingDate, endingDate } = req.body

        const startDate = new Date(startingDate)
        const endDate = new Date(endingDate)
        endDate.setDate(endDate.getDate() + 1)

        const salesData = await Order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $match: {
                    orderDate: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }
            },
            { $unwind: "$user" },
            { $sort: { orderDate: -1 } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productNew",
                },
            },
            { $unwind: "$productNew" },
            {
                $match: { "status": "Delivered" }
            },
            {
                $project: {
                    oId: 1,
                    "user.name": 1,
                    "productNew.name": 1,
                    "productNew.price": 1,
                    "productNew.discountPrice": 1,
                    billTotal: 1,
                    orderDate: 1,
                    paymentMethod: 1,
                    coupon: 1,
                    "items.productPrice": 1,
                    "status": 1,
                    "items.quantity": 1
                }
            }
        ])

        let totalRegularPrice = 0;
        let totalSalesPrice = 0

        for (let i = 0; i < salesData.length; i++) {
            totalRegularPrice = salesData[i].productNew.price * salesData[i].items.quantity

            totalSalesPrice += salesData[i].billTotal
        }
        const totalDiscountPrice = totalRegularPrice - totalSalesPrice

        res.render("salesReport", { salesData, totalRegularPrice, totalDiscountPrice, totalSalesPrice })
    } catch (error) {
        console.log("Errow hwile filetering the sales report using custom Date", error.message)
    }
}

module.exports = {
    loadSales,
    filterReoprt,
    filterCustomDateOrder
}