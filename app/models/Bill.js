import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
    items: [
        {
            _id: mongoose.Schema.Types.ObjectId,
            title: String,
            quantity: Number,
            price: Number,
        }
    ],
    customerName: String,
    discount: Number,
    cgst : Number,
    sgst : Number,
    totalAmount: Number,
    paymentMethod: String,
    ownerEmail: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Bill = mongoose.models.Bill || mongoose.model("Bill", BillSchema);

export default Bill;
