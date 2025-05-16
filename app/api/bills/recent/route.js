import mongoose from "mongoose";
import Bill from "@/app/models/Bill";

export async function POST(req) {
    try {
        const conn = mongoose.connect(process.env.MONGODB_URI)

        const { email, limit = 5 } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                message: "Email is required"
            }), { status: 400 });
        }

        const query = { ownerEmail: email };
        const bills = await Bill.find(query)
            .sort({ createdAt: -1 })
            .limit(limit === null ? 0 : limit)
            .lean(); // Using lean() for better performance

        return new Response(JSON.stringify({
            success: true,
            bills
        }), { status: 200 });

    } catch (error) {
        console.error("Error fetching recent bills:", error);
        return new Response(JSON.stringify({
            success: false,
            message: "Failed to fetch recent bills"
        }), { status: 500 });
    }
}