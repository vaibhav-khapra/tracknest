// /api/allitems/route.js
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Item from '@/app/models/Items';

export async function POST(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const { email } = await req.json();

        const allItems = await Item.find({ ownerEmail: email });

        const totalItems = allItems.reduce((sum, item) => sum + item.quantity, 0);
        const uniqueItems = new Set(allItems.map(item => item.title)).size;

        const outOfStockItems = allItems.filter(item => item.quantity === 0);

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        const validEpoch = new Date("2000-01-01");

        const expiredItems = allItems.filter(item => {
            const exp = new Date(item.expirydate);
            return exp < currentDate && exp > validEpoch;
        });

        // Items expiring within the next 30 days (not already expired)
        const in30Days = new Date(currentDate);
        in30Days.setDate(currentDate.getDate() + 30);

        const expiringSoonItems = allItems
            .filter(item => {
                const exp = new Date(item.expirydate);
                return exp > validEpoch && exp >= currentDate && exp <= in30Days;
            })
            .sort((a, b) => new Date(a.expirydate) - new Date(b.expirydate));

        // Items with low stock: more than 0 but fewer than 20 units
        const lowStockItems = allItems
            .filter(item => item.quantity > 0 && item.quantity < 20)
            .sort((a, b) => a.quantity - b.quantity);

        return NextResponse.json({
            success: true,
            totalItems,
            uniqueItems,
            outOfStock: outOfStockItems.length,
            outOfStockItems,
            expired: expiredItems.length,
            expiredItems,
            expiringSoonItems,   // NEW
            lowStockItems,       // NEW
        });
    } catch (err) {
        console.error("Item summary error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}