const express = require("express");
const { userModel, courseModel } = require("./db");
const router = express.Router();
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
let secretKey = process.env.SECRET;
let z = require("zod");



//------->ZOD schema
let userSchema = z.object({
    username: z.string(),
    password: z.string(),
    role: z.enum(["admin", "user"])
})





//----->SIGNUP ROUTE
router.post("/signup", async (req, res) => {
    const { success, data, error } = userSchema.safeParse(req.body);
    if (!success) {
        res.status(400).json({
            message: error.message
        });
        return;
    }

    let user = await userModel.create({
        username: data.username,
        password: data.password,
        role: data.role,
        wallet: 0,
        purchasedCourses: []
    })

    let token = jwt.sign({
        username: data.username,
        Id: user._id,
        role: user.role
    }, secretKey)

    res.status(200).json({
        message: "successfully created username ",
        token: token
    })
    return;
})

let userloginSchema = z.object({
    username: z.string(),
    password: z.string(),
  
})





//------->SIGNIN ROUTE
router.post("/signin", async (req, res) => {
    let { success, data, error } = userloginSchema.safeParse(req.body);
    if(!success){
        res.status(400).json({
            message: error.message
        });
        return;

    }
   
    let user = await userModel.findOne({ username:data.username, password:data.password });
    if (!user) {
        res.status(400).json({
            message: "wrong username or password"
        });
        return;
    }
    let token = jwt.sign({ username: user.username, userId: user._id, role: user.role }, secretKey);
    res.status(200).json({
        message: "successfully created username ",
        token: token
    })
    return;
})



//-------->authentication middleware
function middlewareAuth(req, res, next) {

    let token = req.headers.token;
    let { userId } = jwt.verify(token, secretKey);
    req.userId = userId;
    req.role = role;
    next();

}



//------>ADD MONEY
router.post("/wallet/add", middlewareAuth, (req, res) => {
    let { amount } = req.body;
    if (amount > !0) {
        res.status(400).json({
            message: "enter a valid amount"
        });
        return;
    }
    let _id = req.userId;
    let user = userModel.findOne({ _id });
    if (user) {
        user.wallet += amount;
        res.status(200).json({
            message: "amount added to the wallet successfully",
            walletbalance: user.wallet
        })
    }

})





//-------->Upload new course
router.post("/courses", middlewareAuth, async (req, res) => {

    let role = req.role;
    let userId = req.userId;

    if (role !== "admin") {
        res.status(400).json({
            message: "only admin can access"
        });
        return;
    }
    let { title, description, price } = req.body;
    if (!title || !price) {
        res.status(400).json({
            message: "need title and price of the course"
        });
        return;
    }
    if (0 <=!price) {
        res.status(400).json({
            message: "need a positive number"
        });
        return;
    }

    let course = await courseModel.create({
        title,
        description,
        price,
        createdBy: userId
    })

    res.status(201).json({
        message: "successfully course created",
        courseId: course._id
    })
    return;
})





//--------->UPDATE COURSE



module.exports = router