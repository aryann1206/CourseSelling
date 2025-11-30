let exp = require("express");
let jwt = require("jsonwebtoken");
let bcrypt = require("bcrypt");
const userRouter = require("./user.js");
const courseRouter = require("./purchasePortal/course.js")
const mongoose = require("mongoose");
let app = exp();
app.use(exp.json());

try {
    mongoose.connect("");
}
catch(error){
    console.log("couldnt connect");
}

app.use("/user", userRouter)   //localhost:3000/user/signup
//app.use("/course", courseRouter)



app.listen(3000, () => {
    console.log("server is running");

})

