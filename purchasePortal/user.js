const express = require("express");
const { userModel, courseModel } = require("./db");
const router = express.Router();
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
//let secretKey = process.env.SECRET;
let secretKey = "kjhvdsvd";
let z = require("zod");
const { message } = require("statuses");



//------->ZOD schema
let userSchema = z.object({
    username: z.string(),
    password: z.string(),
    role: z.enum(["admin", "user"])
})





//----->SIGNUP ROUTE
router.post("/signup", async (req, res) => {
    try {
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
            userId: user._id,
            role: user.role
        }, secretKey)

        res.status(200).json({
            message: "successfully created username ",
            token: token
        })
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})

let userloginSchema = z.object({
    username: z.string(),
    password: z.string()

})





//------->SIGNIN ROUTE
router.post("/signin", async (req, res) => {
    try {
        let { success, data, error } = userloginSchema.safeParse(req.body);
        if (!success) {
            res.status(400).json({
                message: error.message
            });
            return;

        }

        let user = await userModel.findOne({ username: data.username, password: data.password });
        if (!user) {
            res.status(400).json({
                message: "wrong username or password"
            });
            return;
        }
        let token = jwt.sign({ username: user.username, userId: user._id, role: user.role }, secretKey);
        res.status(200).json({
            message: "successfully created username ",//not this message 
            token: token
        })
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: message.error
        })
    }

})



//-------->authentication middleware
function middlewareAuth(req, res, next) {
    try {
        let token = req.headers.token;

        if (!token) {
            return res.status(401).json({
                message: "token missing"
            });
        }

        let { userId, role } = jwt.verify(token, secretKey);

        req.userId = userId;
        req.role = role;

        next();
    }
    catch (error) {
        return res.status(401).json({
            message: "invalid or expired token",
            error: error.message
        });
    }
}



//------>ADD MONEY
router.post("/wallet/add", middlewareAuth, async (req, res) => {
    try {
        let { amount } = req.body;
        if (amount <= 0) {
            res.status(400).json({
                message: "enter a valid amount"
            });
            return;
        }
        let _id = req.userId;
        let user = await userModel.findOne({ _id });
        if (user) {
            user.wallet += amount;
            await user.save();
            res.status(200).json({
                message: "amount added to the wallet successfully",
                walletbalance: user.wallet
            })
        }
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})





//-------->Upload new course
router.post("/courses", middlewareAuth, async (req, res) => {
    try {
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
        if (0 >=price) {
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
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})


//-------->ZOD to update course 
let courseSchema = z.object({
    title: z.string(),
    description: z.string(),
    price: z.number()
}).partial();




//--------->UPDATE COURSE
router.put("/courses/:courseId", middlewareAuth, async (req, res) => {
    try {
        let role = req.role;
        let userId = req.userId;
        let { success, data, error } = courseSchema.safeParse(req.body);
        if (role != "admin") {
            res.status(400).json({
                message: "only admin can access"
            });
            return;
        }
        let courseId = req.params.courseId;
        let course = await courseModel.findOne({ _id: courseId });
        if (course.createdBy == userId) {
            if (!success) {
                res.status(400).json({
                    message: error.message
                });
                return;
            }
            if (data.title !== undefined) {
                course.title = data.title;
            }
            if (data.description !== undefined) {
                course.description = data.description;
            }
            if (data.price !== undefined) {
                course.price = data.price;
            }
            await course.save();
            res.status(201).json({
                message: "updated the course"
            });
            return;
        }
        else {
            res.status(400).json({
                message: "Not allowed. You did not create this course."
            });
            return;

        }
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})



//--------->admin created courses
router.get("/admin/courses", middlewareAuth, async (req, res) => {
    try {
        let userId = req.userId;
        let course = await courseModel.find({ createdBy: userId });
        if (course.length === 0) {
            res.status(400).json({
                message: "only admins can create courses"
            });
            return;
        }
        res.status(201).json({
            course
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})




//--------->to get all courses to public
router.get("/courses", async (req, res) => {
    try {
        let courses = await courseModel.find({});
        res.status(201).json({
            courses
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})


//------->purchase course
router.post("/courses/:courseId/purchase", middlewareAuth, async (req, res) => {
    try {
        let role = req.role;
        let courseId = req.params.courseId;
        if (role === "user") {
            let course = await courseModel.findOne({ _id: courseId });
            if (!course) {
                res.status(401).json({
                    message: "invaild course id"
                });
                return;
            }
            let user = await userModel.findOne({ _id: req.userId });
            if (user) {
                if (user.wallet >= course.price) {
                    user.wallet -= course.price;
                    user.purchasedCourses.push(course._id);
                    await user.save();
                    res.status(201).json({
                        message: "Course purchased successfully",
                        remainingWallet: user.wallet
                    });
                    return;
                }
                else {
                    res.status(401).json({
                        message: "Insufficient balance",
                        wallet: user.wallet,
                        price: course.price
                    });
                    return;
                }
            }
        }
        else {
            res.status(401).json({
                message: "only user can purchase"
            });
            return;
        }
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})



//------->purchased courses
router.get("/purchased-courses", middlewareAuth, async (req, res) => {
    try {
        let userId = req.userId;  // extracted from JWT

        let user = await userModel.findById(userId).populate("purchasedCourses");

        res.status(200).json({
            purchasedCourses: user.purchasedCourses
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});





//--------->get my account details
router.get("/me", middlewareAuth, async (req, res) => {
    try {
        let user = await userModel.findOne({ _id: req.userId });
        res.status(201).json({
            user,
            totalpurchases: user.purchasedCourses.length
        });
        return;
    }
    catch (error) {
        res.status(500).json({
            message: "internet server error",
            error: error.message
        })
    }

})
module.exports = router