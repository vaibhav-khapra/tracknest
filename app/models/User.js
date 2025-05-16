import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    shopName: { type: String},
    mobileNo: { type: String },
    gstin: { type: String },
    address: { type: String },
    ownerName: { type: String }
});

export default mongoose.models.User || mongoose.model("User", userSchema);
