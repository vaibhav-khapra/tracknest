import mongoose from "mongoose";
import Item from "@/app/models/Items";



export async function POST(req) {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const { query, ownerEmail } = await req.json();

        if (!ownerEmail) {
            return new Response(JSON.stringify({ message: "Missing ownerEmail" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const items = await Item.find({
            title: { $regex: query, $options: "i" },
            ownerEmail,
        }).limit(10);

        return new Response(JSON.stringify({ items }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Item search failed:", error);
        return new Response(JSON.stringify({ message: "Error searching items" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
