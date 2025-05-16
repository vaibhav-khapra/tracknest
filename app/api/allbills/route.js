import mongoose from "mongoose";
import Bill from "@/app/models/Bill";

export async function POST(req) {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI)

        const { email, page = 1, limit = 10 } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                message: "Email is required"
            }), { status: 400 });
        }

        const skip = (page - 1) * limit;
        const query = { ownerEmail: email };

        const [bills, totalBills] = await Promise.all([
            Bill.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Bill.countDocuments(query)
        ]);

        const totalPages = Math.ceil(totalBills / limit);

        return new Response(JSON.stringify({
            success: true,
            bills,
            totalBills,
            totalPages,
            currentPage: page
        }), { status: 200 });

    } catch (error) {
        console.error("Error fetching bills:", error);
        return new Response(JSON.stringify({
            success: false,
            message: "Failed to fetch bills"
        }), { status: 500 });
    }
}