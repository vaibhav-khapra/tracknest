import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        description: String,
        price: { type: Number, default: 0 },
        quantity: { type: Number, required: true, min: 0 },
        expirydate: { type: Date,default: null, },
        ownerEmail: { type: String, required: true },
    },
    { timestamps: true }
);

const Item = mongoose.models.Item || mongoose.model('Item', itemSchema);
export default Item;
