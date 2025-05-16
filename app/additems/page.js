"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Navbar from "../components/Navbar";

export default function AddItemPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [serverMessage, setServerMessage] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status]);

    const onSubmit = async (data) => {
        if (!session?.user?.email) return;

        setServerMessage("");

        const payload = {
            ...data,
            price: Number(data.price),
            quantity: Number(data.quantity),
            ownerEmail: session.user.email,
        };

        // Check for empty string or invalid date
        if (data.expirydate && !isNaN(new Date(data.expirydate).getTime())) {
            payload.expirydate = new Date(data.expirydate).toISOString();
        } else {
            payload.expirydate = null; // Make it null explicitly
        }

        try {
            const res = await fetch("/api/additems", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (result.success) {
                setServerMessage("✅ Item added successfully!");
                reset();
            } else {
                setServerMessage(`❌ ${result.message || "Failed to add item."}`);
            }
        } catch (err) {
            console.error(err);
            setServerMessage("❌ Server error. Please try again.");
        }
    };
    

    if (status !== "authenticated") return null;

    return (
        <>
            <Navbar />
            <div className="p-6 max-w-2xl mx-auto mt-[90px] bg-white shadow-md rounded-lg">
                <h1 className="text-3xl font-semibold mb-6 text-gray-800 text-center">Add New Item</h1>

                {serverMessage && (
                    <div className="mb-4 p-3 rounded text-sm text-white bg-green-600 text-center">
                        {serverMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Item Title<span className="text-red-500">*</span></label>
                        <input
                            {...register("title", { required: "Title is required" })}
                            placeholder="Enter item title"
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.title && (
                            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Item Description</label>
                        <textarea
                            {...register("description")}
                            placeholder="Enter item description"
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Price (₹)<span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            step="0.01"
                            {...register("price", {
                                required: "Price is required",
                                min: { value: 0.01, message: "Price must be greater than 0" },
                            })}
                            placeholder="Enter item price"
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.price && (
                            <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Quantity Available<span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            {...register("quantity", {
                                required: "Quantity is required",
                                min: { value: 0, message: "Quantity cannot be negative" },
                            })}
                            placeholder="Enter quantity"
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.quantity && (
                            <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                        )}
                    </div>

                    
                    <div>
                        <label className="block mb-1 text-gray-700 font-medium">Expiry Date</label>
                        <input
                            type="date"
                            {...register("expirydate")}
                            className="w-full border border-gray-300 p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {errors.expirydate && (
                            <p className="text-red-600 text-sm mt-1">{errors.expirydate.message}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="text-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-60"
                        >
                            {isSubmitting ? "Adding..." : "Add Item"}
                        </button>
                    </div>
                </form>
            </div>

        </>
    );
}
