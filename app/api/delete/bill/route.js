import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Bill from "@/app/models/Bill";

export async function POST(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Match the key sent from the frontend (_id)
        const { _id } = await req.json();

        if (!_id) {
            return NextResponse.json({
                success: false,
                message: "ID is required"
            }, { status: 400 });
        }

        // 2. Find and delete the document
        // findByIdAndDelete is more efficient than find() then delete
        const deletedBill = await Bill.findByIdAndDelete(_id);

        // 3. Handle case where ID doesn't exist
        if (!deletedBill) {
            return NextResponse.json({
                success: false,
                message: "No bill found with that ID"
            }, { status: 404 });
        }

        // 4. Return success
        return NextResponse.json({
            success: true,
            message: `Bill ${deletedBill.title || _id} deleted successfully`,
            deletedCount: 1
        });

    } catch (err) {
        console.error("Delete item error:", err);
        return NextResponse.json({
            success: false,
            message: "Server error"
        }, { status: 500 });
    }
}