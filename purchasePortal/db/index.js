//------->Schema that should be used
const mongoose = require("mongoose");
let userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    role: String,
    wallet: Number,
    purchasedCourses: [String]
})
let courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    createdBy: String
})


let userModel = mongoose.model("users",userSchema);
let courseModel = mongoose.model("courses",courseSchema);


module.exports = {
    userModel,
    courseModel
}