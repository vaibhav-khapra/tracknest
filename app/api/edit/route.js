import mongoose from "mongoose";
import Item from "@/app/models/Items";

export async function POST(request) {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log("connected")
        const { email, originalTitle, updatedItem } = await request.json();
        console.log("originalTitle:", originalTitle);
        const existingItem = await Item.findOne({
            ownerEmail : email,
            title: originalTitle
        });
        
        console.log(existingItem)

        if (!existingItem) {
            return new Response(JSON.stringify({
                success: false,
                message: "Item not found"
            }), { status: 404 });
        }

        // Update the item
        const updated = await Item.findOneAndUpdate(
            { _id: existingItem._id },
            {
                $set: {
                    title: updatedItem.title,
                    description: updatedItem.description,
                    quantity: updatedItem.totalQuantity,
                    price: updatedItem.price,
                    expirydate: updatedItem.expirydate
                }
            },
            { new: true }
        );

        return new Response(JSON.stringify({
            success: true,
            message: "Item updated successfully",
            item: updated
        }), { status: 200 });

    } catch (error) {
        console.error("Error editing item:", error);
        return new Response(JSON.stringify({
            success: false,
            message: "Failed to edit item"
        }), { status: 500 });
    }
}
