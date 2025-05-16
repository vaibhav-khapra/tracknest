import mongoose from "mongoose";
import Bill from "@/app/models/Bill";

export async function POST(req) {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        const { email, startDate, endDate } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({
                success: false,
                message: "Email is required"
            }), { status: 400 });
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        const todaySales = await Bill.aggregate([
            { $match: { ownerEmail: email, createdAt: { $gte: startOfToday, $lt: endOfToday } } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);

        const weekSales = await Bill.aggregate([
            { $match: { ownerEmail: email, createdAt: { $gte: startOfWeek } } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
        ]);

        let customSales = 0;
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            customSales = await Bill.aggregate([
                { $match: { ownerEmail: email, createdAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
            ]);
        }

        return new Response(JSON.stringify({
            success: true,
            todaySales: todaySales[0]?.totalSales || 0,
            weekSales: weekSales[0]?.totalSales || 0,
            customSales: customSales[0]?.totalSales || 0
        }), { status: 200 });

    } catch (error) {
        console.error("Error fetching sales summary:", error);
        return new Response(JSON.stringify({
            success: false,
            message: "Failed to fetch sales summary"
        }), { status: 500 });
    }
}
