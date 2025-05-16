// /api/delete/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Item from "@/app/models/Items";

export async function POST(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tracknest");
        const { email, title, quantity } = await req.json();
        if (!email || !title) {
            return NextResponse.json({
                success: false,
                message: "Email and item title are required"
            }, { status: 400 });
        }

        if (quantity === 0 || quantity === undefined) {
            const result = await Item.deleteMany({
                ownerEmail: email,
                title: title
            });

            if (result.deletedCount > 0) {
                return NextResponse.json({
                    success: true,
                    message: `All ${title} items deleted successfully`,
                    deletedCount: result.deletedCount
                });
            } else {
                return NextResponse.json({
                    success: false,
                    message: "No items found to delete"
                }, { status: 404 });
            }
        }

        const items = await Item.find({
            ownerEmail: email,
            title: title
        }).sort({ expirydate: 1, createdAt: 1 }); 

        if (items.length === 0) {
            return NextResponse.json({
                success: false,
                message: "No items found to delete"
            }, { status: 404 });
        }

        let quantityToDelete = parseInt(quantity);
        let deletedCount = 0;

        for (const item of items) {
            if (quantityToDelete <= 0) break;

            if (item.quantity <= quantityToDelete) {
              
                await Item.deleteOne({ _id: item._id });
                quantityToDelete -= item.quantity;
                deletedCount += item.quantity;
            } else {
                await Item.updateOne(
                    { _id: item._id },
                    { $inc: { quantity: -quantityToDelete } }
                );
                deletedCount += quantityToDelete;
                quantityToDelete = 0;
            }
        }

        return NextResponse.json({
            success: true,
            message: `${deletedCount} units of ${title} deleted successfully`,
            deletedCount
        });
    } catch (err) {
        console.error("Delete item error:", err);
        return NextResponse.json({
            success: false,
            message: "Server error"
        }, { status: 500 });
    }
}