import mongoose from "mongoose";
import Bill from "@/app/models/Bill";

export async function POST(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const { email, startDate, endDate } = await req.json();

        if (!email) {
            return new Response(JSON.stringify({ success: false, message: "Email is required" }), { status: 400 });
        }

        // --- Date Logic Fixes ---
        const now = new Date();
        
        // Today: From 00:00:00 of the current day
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Week: Sunday of the current week (without mutating 'now')
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

        // Helper for Aggregation
        const getSales = async (start, end = null) => {
            const matchQuery = { ownerEmail: email, createdAt: { $gte: start } };
            if (end) matchQuery.createdAt.$lte = end;

            const result = await Bill.aggregate([
                { $match: matchQuery },
                { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
            ]);
            return result[0]?.totalSales || 0;
        };

        // 1. Fetch Today
        const todaySales = await getSales(startOfToday);

        // 2. Fetch Week
        const weekSales = await getSales(startOfWeek);

        // 3. Fetch Custom (if dates provided)
        let customSales = 0;
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Start of the first day

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // End of the last day (Crucial Fix!)

            customSales = await getSales(start, end);
        }

        return new Response(JSON.stringify({
            success: true,
            todaySales,
            weekSales,
            customSales
        }), { status: 200 });

    } catch (error) {
        console.error("Error fetching sales summary:", error);
        return new Response(JSON.stringify({ success: false, message: "Internal Server Error" }), { status: 500 });
    }
}