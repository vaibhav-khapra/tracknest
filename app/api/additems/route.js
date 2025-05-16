import { NextResponse } from "next/server";
import Item from "@/app/models/Items";
import mongoose from "mongoose";

export async function POST(req) {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)

        const { title, description, price, quantity, expirydate, ownerEmail } = await req.json();

        
        if (!title || !ownerEmail || quantity == null) {
            return NextResponse.json(
                { success: false, message: "Missing fields" },
                { status: 400 }
            );
        }
        
        const newItem = new Item({
            title,
            description,
            price,
            quantity,
            expirydate: expirydate || null,
            ownerEmail,
        });
       

        await newItem.save();

        return NextResponse.json({ success: true, item: newItem });
    } catch (error) {
        console.error("Error in /api/additem:", error);
        return NextResponse.json(
            { success: false, message: "Server error" },
            { status: 500 }
        );
    }
}