
import mongoose from "mongoose";
import Item from "@/app/models/Items";
import Bill from "@/app/models/Bill";



export async function POST(req) {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const {
            items,
            customerName,
            discount,
            cgst,sgst,
            totalAmount,
            paymentMethod,
            ownerEmail,
        } = await req.json();

        if (!ownerEmail || !Array.isArray(items) || items.length === 0) {
            return new Response(JSON.stringify({ message: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

       
        for (const item of items) {
            const dbItem = await Item.findOne({ _id: item._id, ownerEmail });
            
            if (!dbItem) {
                return new Response(JSON.stringify({ message: `Item not found: ${item.title}` }), {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                });
            }
            
            if (dbItem.quantity < item.quantity) {
                return new Response(JSON.stringify({ message: `Insufficient stock for ${item.title}` }), {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                });
            }
        }

        
        const bill = new Bill({
            items,
            customerName,
            discount,
            cgst,
            sgst,
            totalAmount,
            paymentMethod,
            ownerEmail,
            createdAt: new Date(),
        });
        await bill.save();

        
        const bulkOps = items.map((item) => ({
            updateOne: {
                filter: { _id: item._id, ownerEmail },
                update: { $inc: { quantity: -item.quantity } },
            },
        }));

        await Item.bulkWrite(bulkOps);

        return new Response(JSON.stringify({ message: "Bill created and stock updated." }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Bill creation error:", error);
        return new Response(JSON.stringify({ message: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
