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
        const expiredItems = allItems.filter(item =>
            new Date(item.expirydate) < currentDate && new Date(item.expirydate) > new Date("2000-01-01")
        );

        return NextResponse.json({
            success: true,
            totalItems,
            uniqueItems,
            outOfStock: outOfStockItems.length,
            outOfStockItems,
            expired: expiredItems.length,
            expiredItems
        });
    } catch (err) {
        console.error("Item summary error:", err);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}