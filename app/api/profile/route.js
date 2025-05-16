import mongoose from "mongoose";
import User from "@/app/models/User";

export async function POST(req) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const { email } = await req.json();
        const users = await User.findOne({ email });

        return new Response(JSON.stringify({ users }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Server error, please try again later.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}