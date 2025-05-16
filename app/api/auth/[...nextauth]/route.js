import NextAuth from "next-auth";
import mongoose from "mongoose";
import User from "@/app/models/User";
import GoogleProvider from "next-auth/providers/google";

let isConnected = false; // Prevent multiple DB connections

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account.provider === "google") {
                if (!isConnected) {
                    await mongoose.connect(process.env.MONGODB_URI);
                    isConnected = true;
                }

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    const newUser = new User({
                        email: user.email,
                        shopname: "",
                        mobileno: "",
                        gstin: "",
                        address: "",
                        ownername: ""
                    });
                    await newUser.save();
                }
            }
            isConnected = false

            return true;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
