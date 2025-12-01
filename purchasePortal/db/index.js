//------->Schema that should be used
const mongoose = require("mongoose");
try {
    mongoose.connect("mongodb+srv://100xmediasomething_db_user:cYsUiBMgrTJgBjr7@automationapp.varqofb.mongodb.net/todo-app-harkirat");
}
catch (error) {
    console.log("couldnt connect");
}

let userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    role: String,
    wallet: Number,
    purchasedCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "courses"   // should match mongoose.model("courses")
    }]
})

let courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    }
});


let userModel = mongoose.model("users", userSchema);
let courseModel = mongoose.model("courses", courseSchema)

module.exports = {
    userModel,
    courseModel
}