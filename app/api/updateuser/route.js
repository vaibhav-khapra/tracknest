import mongoose from "mongoose";
import User from "@/app/models/User";

const MONGODB_URI = process.env.MONGODB_URI;

// Define allowed fields that can be updated
const ALLOWED_UPDATES = ['shopName', 'mobileNo', 'gstin', 'address', 'ownerName'];

export async function POST(req) {
    try {
        // Connect to MongoDB if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        }

        const { email, updates } = await req.json();

        // Validate input
        if (!email || !updates || typeof updates !== "object") {
            return new Response(JSON.stringify({
                message: "Missing or invalid email/updates",
                details: "Email and updates object are required"
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Filter updates to only include allowed fields
        const filteredUpdates = Object.keys(updates).reduce((acc, key) => {
            if (ALLOWED_UPDATES.includes(key)) {
                acc[key] = updates[key];
            }
            return acc;
        }, {});

        // Check if any valid updates remain after filtering
        if (Object.keys(filteredUpdates).length === 0) {
            return new Response(JSON.stringify({
                message: "No valid fields to update",
                details: `Allowed fields: ${ALLOWED_UPDATES.join(', ')}`
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Perform the update
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: filteredUpdates },
            {
                new: true,

                projection: updates
            }
        ).lean(); // Convert to plain JavaScript object
        console.log(updatedUser)

        if (!updatedUser) {
            return new Response(JSON.stringify({
                message: "User not found",
                details: `No user found with email: ${email}`
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            message: "User updated successfully",
            user: updatedUser
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error updating user:", error);
        return new Response(JSON.stringify({
            message: "Internal server error",
            error: error.message,
            details: "Please check the server logs for more information"
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    } finally {
        // Consider whether to disconnect here or maintain persistent connection
        // await mongoose.disconnect();
    }
}