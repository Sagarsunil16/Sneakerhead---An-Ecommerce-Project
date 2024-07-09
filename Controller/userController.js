
// require('dotenv').config({ path: '../config/.env' });
const User = require('../models/user')
const bcrypt = require('bcrypt')
const otpgenerator = require('otp-generator')
const nodemailer = require('nodemailer')
const ProductData = require('../models/product');
const Category = require('../models/category');
const Product = require('../models/product');
const Order = require('../models/order');
const Address = require('../models/address');
const Wallet = require('../models/wallet');


const securepassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.log(error.message)
    }
}

const sendInsertOtp = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASS,
            },
            tls: {
                rejectUnauthorized: false // Disable certificate verification
            }
        });
        const mailOptions = {
            from: 'sneakerhead16.in@gmail.com',
            to: email,
            subject: 'Your one time password',
            html: `Hi, Your OTP is ${otp}`
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log("email has been sent:-", info.response);
            }
        })
    } catch (error) {
        console.log(error.message);
    }
};

const generateOTP = () => {
    const OTP = otpgenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
        lowerCaseAlphabets: false,
        digits: true
    });
    return OTP;
};

const insertUser = async (req, res) => {
    try {
        // Generate OTP
        const otp = generateOTP();
        console.log(otp);

        // Storing into session
        req.session.Data = { ...req.body, otp };
        req.session.save();
        console.log(req.session.Data.otp, 'wWWWWWW');
        await sendInsertOtp(req.body.email, otp);
        res.redirect('/user/verifyOTP');
        // Delete OTP after 30 seconds
        setTimeout(() => {
            delete req.session.Data.otp;
            req.session.save()
            console.log('OTP deleted from session after 30 seconds');
            console.log(otp)
        }, 30000); // 30 seconds

    } catch (error) {
        console.log('otp', error.message);
        res.status(500).send('Internal Server Error');
    }
};

const loadOtp = async (req, res) => {
    try {
        const messages = ["OTP send to mail"]; // Example messages
        console.log(messages)
        res.render('verifyOTP', { messages: messages });
    } catch (error) {
        console.log(error.message);
    }
}


const getOtp = async (req, res) => {

    try {
        const otpInBody = req.body.otp;
        console.log(otpInBody, 'otp...............................');
        const otp = req.session.Data.otp;

        if (!otp || otpInBody !== otp) {
            const messages = ["Invalid OTP. Please try again."];
            return res.status(404).json({ message: "Invalid OTP. Please try again." })
        }
        else {
            const { name, email, mobile, password, referralCode } = req.session.Data

            if (referralCode) {
                let refferedUser = await User.findOne({ referralCode: referralCode })
                if (refferedUser) {
                    let newJoin = {
                        username: name,
                        status: "Success"
                    }

                    refferedUser.successfullReferrals.push(newJoin)
                    refferedUser.referralRewards += 100
                    await refferedUser.save()
                }
            }
            const passwordHash = await securepassword(req.session.Data.password);
            const existingUser = await User.findOne({ email: email })
            if (!existingUser) {
                const user = new User({
                    name: name,
                    email: email,
                    mobile: mobile,
                    password: passwordHash,
                    verified: 1,
                    is_admin: 0,
                    blocked: false,
                    referralCode: generateRefferalCode(8)
                });

                await user.save();//save to db
            }
            return res.status(200).json({ message: "OTP verified successfully" })
        }

    } catch (error) {
        console.log('Error in OTP verification:', error.message);
        return res.render('verifyOTP', { message: 'An error occurred during OTP verification. Please try again later.' });
    }
};

let resendOtp = async (req, res) => {
    try {
        const otp = generateOTP();
        await sendInsertOtp(req.session.Data.email, otp);
        console.log(otp)
        req.session.Data.otp = otp;
        res.status(200).json({
            status: true
        })

    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({
            status: false,
            message: 'Error resending OTP'
        });
    }
};

const loadSearch = async (req, res) => {
    try {
        const searchQuery = req.query.q.toLowerCase();
        // Find the category based on the search query
        const category = await Category.findOne({ name: searchQuery });
        const user = req.session.passport ? req.session.passport.user : undefined; // Replace null with undefined

        if (!category) {
            console.log("Category not found");
            return res.render('index', { user, product: [] });
        }

        // Find products based on the category name
        const ProductDetails = await ProductData.find({ category: category._id }).populate('category');

        res.render('index', { user, product: ProductDetails });

    } catch (error) {
        if (error.message.includes("Cannot read properties of undefined")) {
            console.log("Category not found, rendering index without product images");
            return res.render('index', { user_id: req.session.passport.user, product: [] });
        } else {
            console.log(error.message);
            res.status(500).send("Error retrieving products");
        }
    }
}
const loadHomepage = async (req, res) => {
    try {
        const ProductData = await Product.find({})
        const user = req.session.passport ? req.session.passport.user : undefined;
        res.render('index', { user, product: ProductData })
    }
    catch (error) {
        console.log("Error while  rendering the Home-page", error.message)
    }
}
const loadRegister = async (req, res) => {
    try {
        res.render('Register')
    } catch (error) {
        console.log("Error while Registration", error.message)
    }
}
const verifyEmail = async (req, res) => {
    try {
        res.render('verifyEmail')
    } catch (error) {
        console.log('Error while rendering the verify-email page', error.message)
    }
}
const loadLogin = async (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.log("Eroor while rendering the LoginPage", error.message)
    }
}
const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({ email: email })

        if (userData) {
            const passMatch = await bcrypt.compare(password, userData.password)

            if (passMatch) {
                if (userData.is_admin === 1 || userData.blocked === true) {
                    return res.render("login", { message: "Acccess denied" })
                }
                else {
                    req.session.passport = { user: userData._id }
                    return res.redirect('/user/index')
                    // return res.render('index',{user_id: req.session.passport.user})
                }
            }
            else {
                return res.render("login", { message: "Invalid Email or Password" })
            }
        }
        else {
            return res.render('login', { message: "Invalid Email or Password" })
        }
    } catch (error) {
        console.log("Error", error.message)
    }

}
const loadIndex = async (req, res) => {
    try {
        // Retrieve the category ID corresponding to the category name "Mens" from the category collection
        const mensCategory = await Category.findOne({ name: "Mens" });

        if (!mensCategory) {
            console.log("Mens category not found");
            // Render the index with an empty product list
            return res.render('index', { user: req.session.passport.user, product: [] });
        }
        // Use the obtained category ID to query the product collection
        const ProductDetails = await ProductData.find({ category: mensCategory._id });

        // Render the index with the product details
        res.render('index', { user: req.session.passport.user, product: ProductDetails });
    } catch (error) {
        console.log('Error', error.message);
        res.status(500).send("Error while loading the index page");
    }
}


const loadShop = async (req, res) => {
    try {
        let query = { is_deleted: false };
        let andConditions = [{ is_deleted: false }];

        if (req.query.q) {
            const searchQuery = req.query.q;
            const searchCondition = {
                $or: [
                    { brand: { $regex: searchQuery, $options: 'i' } },
                    { description: { $regex: searchQuery, $options: 'i' } },
                    { name: { $regex: searchQuery, $options: 'i' } }
                ]
            };
            andConditions.push(searchCondition);
        }

        if (req.query.category) {
            andConditions.push({ category: req.query.category });
        }

        if (req.query.brand) {
            andConditions.push({ brand: req.query.brand });
        }

        if (andConditions.length > 1) {
            query = { $and: andConditions };
        }

        let sortOption = {};
        switch (req.query.sort) {
            case 'priceAsc':
                sortOption = { price: 1 };
                break;
            case 'priceDsc':
                sortOption = { price: -1 };
                break;
            case 'nameAsc':
                sortOption = { name: 1 };
                break;
            case 'nameDsc':
                sortOption = { name: -1 };
                break;
            default:
                sortOption = { name: 1 };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;

        const totalProd = await ProductData.countDocuments(query);
        const totalPages = Math.ceil(totalProd / limit);

        let filteredProducts = await ProductData.find(query)
            .populate('category')
            .skip(skip)
            .limit(limit)
            .sort(sortOption);

        const categories = await Category.find({ is_Active: true });

        const priceRanges = [
            { min: 0, max: 50, label: 'Rs0.00 - Rs50.00' },
            { min: 50, max: 100, label: 'Rs50.00 - Rs100.00' },
            { min: 100, max: 150, label: 'Rs100.00 - Rs150.00' },
            { min: 150, max: 200, label: 'Rs150.00 - Rs200.00' },
            { min: 200, max: 250, label: 'Rs200.00 - Rs250.00' }
        ];

        const userId = req.session.passport? req.session.passport.user:undefined
        res.render('shop', {
            sortOption: req.query.sort,
            user_id: userId,
            product: filteredProducts,
            category: categories,
            priceRanges: priceRanges,
            query: req.query,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (error) {
        console.log("Error while loading the shop Page", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};




const loadForgotPassword = async (req, res) => {
    try {
        res.render('forgot-password')
    } catch (error) {
        console.log("Error while loading Forgor-password Page", error.message)
    }
}
const logout = async (req, res) => {
    try {
        req.session.destroy()
        res.redirect('/user/login')
    } catch (error) {
        console.log(error.message)
        res.redirect('/user/login')
    }
}

function generateRefferalCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let refferalCode = ''
    for (let i = 0; i < length; i++) {
        refferalCode += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return refferalCode
}
const loadUserProfile = async (req, res) => {
    try {
        const id = req.session.passport.user
        const OrderData = await Order.find({ user: id }).populate({path:"items.procustId",model:"Product"}).sort({ createdAt: -1 }) || []
        const address = await Address.findOne({ user: id }) || null

        const userData = await User.findById(id)
        const wallet = await Wallet.findOne({ user: userData._id }).populate("order") || null
        let refferalCode

        if (userData) {
            refferalCode = userData.referralCode
        }
        if (!refferalCode) {
            const refferalCode = generateRefferalCode(8)
            userData.referralCode = refferalCode
            await userData.save()
        }

        const successfullRefferals = userData.successfullReferrals.reverse()
        res.render('userprofile', {
            user_id: req.session.passport.user, user: userData, orders: OrderData, address: address, wallet: wallet, refferalCode: refferalCode,
            successfullRefferals,
            refferalRewards: userData.referralRewards
        })
    } catch (error) {
        console.log(error.message)
    }
}

const loadeditAddress = async (req, res) => {
    try {
        const user = await User.findById(req.session.passport.user);
        let useraddresses = await Address.findOne({
            user: user._id
        });
        const addressType = req.query.addressType;

        const address = useraddresses.addresses.find(address => address.addressType === addressType);


        if (address) {

            res.render('editAddress', { user_id: req.session.passport.user, addresses: address });
        } else {

            console.log('Address or HouseNo not found');

        }

    }
    catch (error) {
        console.log('editAddress', error.message);
    }

};


const editProfile = async (req, res) => {
    try {
        const userid = req.session.passport.user;
        const { name, mobile, email } = req.body;

        // Fetch address, user, wallet, and orders
        const address = await Address.findOne({ user: userid }) || null;
        const user = await User.findById(userid);
        const wallet = await Wallet.findOne({ user: userid }).populate("order") || null;
        const orders = await Order.find({ user: userid }) || [];

        // Validate email and mobile
        const existingEmailUser = await User.findOne({ email: email });
        if (existingEmailUser && existingEmailUser._id.toString() !== userid) {
            return res.render('userProfile', {
                error: 'Email already in use.',
                user, address, orders, wallet
            });
        }

        const existingMobileUser = await User.findOne({ mobile: mobile });
        if (existingMobileUser && existingMobileUser._id.toString() !== userid) {
            return res.render('userProfile', {
                error: 'Mobile number already in use.',
                user, address, orders, wallet
            });
        }

        // Update the user profile
        const updatedUser = await User.findByIdAndUpdate(
            userid,
            {
                $set: {
                    name: name,
                    mobile: mobile,
                    email: email,

                }
            },
            { new: true }
        );

        let refferalCode

        if (user) {
            refferalCode = user.referralCode
        }
        if (!refferalCode) {
            const refferalCode = generateRefferalCode(8)
            user.referralCode = refferalCode
            await user.save()
        }
        // Handle success and error cases
        if (updatedUser) {
            return res.render('userProfile', {
                message: 'Updated successfully!',
                user: updatedUser, address, orders, wallet, refferalCode
            });
        } else {
            return res.render('userProfile', {
                error: 'Failed to update user details.',
                user, address, orders, wallet, refferalCode
            });
        }

    } catch (error) {
        console.error('editProfile error:', error.message);
        return res.status(500).json({ message: "Internal server occured" })
    }
};


const loadAddAddress = async (req, res) => {
    try {
        res.render('addAddress', { user_id: req.session.passport.user })
    } catch (error) {
        console.log("Error", error.message)
    }
}

const addAddress = async (req, res) => {
    try {

        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
        } = req.body

        const user = await User.findById(req.session.passport.user)

        if (!user) {
            conso; e.log('User not found')
        }

        let userAddresses = await Address.findOne({ user: user._id })

        if (!userAddresses) {
            // If the useraddresses document doesn't exist, create a new one

            userAddresses = new Address({
                user: user._id,
                addresses: []
            })
        }

        // Check if the address already exists for the user

        const existingAddress = userAddresses.addresses.find((address) =>
            address.addressType === addressType &&
            address.HouseNo === houseNo &&
            address.Street === street &&
            address.pincode === pincode &&
            address.Landmark === landmark &&
            address.city === city &&
            address.district == district &&
            address.State === state &&
            address.Country === country
        )
        const existtype = userAddresses.addresses.find((address) => address.addressType === addressType)

        if (existingAddress) {
            res.render('addAddress', { error: 'Address already exists for this user' });
        }

        else if (existtype) {

            res.render('addAddress', { error: `${existtype.addressType} is alredy registered` });

        }

        else if (userAddresses.addresses.length >= 3) {

            res.render('addAddress', { error: 'User cannot have more than 3 addresses' });

        }

        else {
            // Create a new address object
            const newAddress = {
                addressType: addressType,
                HouseNo: houseNo,
                Street: street,
                Landmark: landmark,
                pincode: pincode,
                city: city,
                district: district,
                State: state,
                Country: country,
            };

            userAddresses.addresses.push(newAddress);


            await userAddresses.save();

            res.redirect('/user/profile');
        }

    } catch (error) {
        console.log("Error while adding the address".error.message)
    }
}

const editAddress = async (req, res) => {
    try {
        const {
            addressType,
            houseNo,
            street,
            landmark,
            pincode,
            city,
            district,
            state,
            country
        } = req.body;

        const addresses = await Address.findOne({
            user: req.session.passport.user
        });

        if (!addresses) {
            console.log('Address is not found');
            // Handle the case where addresses are not found
            return res.status(404).send('Address not found');
        }


        const addressToEdit = addresses.addresses.find(addr => addr.addressType === addressType);

        if (!addressToEdit) {
            console.log('Address with type not found');
            // Handle the case where the specified address type is not found
            return res.status(404).send('Address type not found');
        }

        // Update the address fields
        addressToEdit.HouseNo = houseNo;
        addressToEdit.Street = street;
        addressToEdit.Landmark = landmark;
        addressToEdit.pincode = pincode;
        addressToEdit.city = city;
        addressToEdit.district = district;
        addressToEdit.State = state;
        addressToEdit.Country = country;

        // Save the changes
        await addresses.save();
        const user = await User.findById(req.session.passport.user)
        const orders = await Order.findOne({ user: user._id }) || [];;

        return res.render('userProfile', { address: addresses, message: 'Updated successfully!', user, orders });
    } catch (error) {
        console.log("Error white editing the address", error.message)
    }
}

const deleteAddress = async (req, res) => {
    try {
        const user = await User.findById(req.session.passport.user)
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const addresses = await Address.findOne({ user: user._id })

        const addressTypeToDelete = req.query.addressType
        const addressIndeXToDelete = addresses.addresses.findIndex((address) => address.addressType === addressTypeToDelete)

        addresses.addresses.splice(addressIndeXToDelete, 1)

        await addresses.save()

        return res.redirect('/user/profile');

    } catch (error) {
        console.log("Error while deleteing the address", error.message)
    }
}


const addToWallet = async (req, res) => {
    try {
        const userId = req.session.passport.user;
        const userData = await User.findById(userId);
        let userWallet = await Wallet.findOne({ user: userData._id });
        if (userData.referralRewards < 100) {
            return res.status(400).json({ success: false, message: "Balance is not enough" })
        }
        if (!userWallet) {
            userWallet = new Wallet({
                user: userData._id,
                balance: 0,
                order: []
            });
        }

        userWallet.balance += userData.referralRewards;
        await userWallet.save();

        userData.referralRewards = 0;
        await userData.save();

        return res.status(200).json({ success: true, message: "Successfully transferred" });
    } catch (error) {
        console.log("Error while transferring the referral amount to the wallet", error.message);
        res.status(404).json({ success: false, message: "Internal server error" });
    }
};


const loadChangePassword = async (req, res) => {
    try {
        res.render('forgotPassword', { user_id: req.session.passport.user })
    } catch (error) {
        console.log("Error while loading the change password page")
        res.status(500).json({ message: "Internal Server Error" })
    }
}

const changePassword = async (req, res) => {
    try {
        const user = await User.findById(req.session.passport.user)
        const { oldPassword, password } = req.body
        const sPassword = await securepassword(password)
        if (user) {
            const passMatch = await bcrypt.compare(oldPassword, user.password)
            if (passMatch) {
                user.password = sPassword
                await user.save()
                return res.status(200).json({ ok: true, message: "Password changed successfully" })
            } else {
                return res.status(400).json({ ok: false, message: "Incorrect old password" })
            }
        } else {
            return res.status(400).json({ ok: false, message: "User not found" })
        }
    } catch (error) {
        console.log("error while changing the password", error.message)
        res.status(400).json({ ok: false, message: "Internal server error" })
    }
}

const loadContactUs = async (req, res) => {
    try {
        const userId = req.session.passport? req.session.passport.user:undefined
        res.render("contact", { user: userId })
    } catch (error) {
        console.log("error while loading the contact us page", error.message)
    }
}


module.exports =
{
    loadHomepage,
    loadLogin,
    loadRegister,
    insertUser,
    loadForgotPassword,
    verifyLogin,
    loadShop,
    loadIndex,
    verifyEmail,
    logout,
    resendOtp,
    getOtp,
    loadOtp,
    sendInsertOtp,
    loadSearch,
    loadUserProfile,
    editProfile,
    loadAddAddress,
    addAddress,
    loadeditAddress,
    editAddress,
    deleteAddress,
    addToWallet,
    loadChangePassword,
    changePassword,
    loadContactUs

}