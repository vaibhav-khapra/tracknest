import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Item from "@/app/models/Items";

export async function POST(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const { email } = await req.json();

        const items = await Item.aggregate([
            { $match: { ownerEmail: email } },
            {
                $group: {
                    _id: {
                        title: "$title",
                        price: "$price",
                        expirydate: "$expirydate",
                    },
                    description: { $first: "$description" },
                    totalQuantity: { $sum: "$quantity" }
                }
            },
            {
                $project: {
                    _id: 0,
                    title: "$_id.title",
                    price: "$_id.price",
                    description: "$description",
                    expirydate: "$_id.expirydate",
                    totalQuantity: 1
                }
            }
        ]);



        return NextResponse.json({ success: true, items });
    } catch (err) {

        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}