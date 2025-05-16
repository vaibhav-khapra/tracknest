"use client";
import React, { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useForm } from 'react-hook-form';

const Page = () => {
    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState({ success: null, message: '' });

    // Redirect if not logged in
    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    // Fetch existing user data and reset form
    useEffect(() => {
        const fetchUserData = async () => {
            if (!session?.user?.email) return;

            try {
                const response = await fetch("/api/profile", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: session.user.email }),
                });

                if (!response.ok) throw new Error('Failed to fetch user data');

                const data = await response.json();
                setUser(data.users);
                // Reset form with fetched data
                reset({
                    shopName: data.users?.shopName || '',
                    mobileNo: data.users?.mobileNo || '',
                    gstin: data.users?.gstin || '',
                    address: data.users?.address || '',
                    ownerName: data.users?.ownerName || ''
                });
            } catch (error) {
                console.error("Error fetching data:", error);
                setUpdateStatus({ success: false, message: 'Failed to load profile data' });
            }
        };

        if (session) fetchUserData();
    }, [session, reset]);

    const onSubmit = async (data) => {
        if (!session?.user?.email || !isDirty) return;

        setIsUpdating(true);
        setUpdateStatus({ success: null, message: '' });

        try {
            const res = await fetch('/api/updateuser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: session.user.email,
                    updates: {
                        shopName: data.shopName,
                        mobileNo: data.mobileNo,
                        gstin: data.gstin,
                        address: data.address,
                        ownerName: data.ownerName,
                    },
                }),
            });

            const result = await res.json();

            if (res.ok) {
                setUpdateStatus({ success: true, message: 'Profile updated successfully!' });
                setTimeout(() => router.push("/dashboard"), 1500);
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (err) {
            console.error("Update failed", err);
            setUpdateStatus({ success: false, message: err.message || 'Failed to update profile' });
        } finally {
            setIsUpdating(false);
        }
    };

    if (status === "loading") return <div className="flex justify-center items-center h-screen">Loading session...</div>;
    if (!user) return <div className="flex justify-center items-center h-screen">Loading user data...</div>;

    return (
        <>
            <Navbar />
            <div className='mt-[90px] p-6'>
                <h2 className="text-2xl font-bold mb-4">User Profile</h2>
                <div className="bg-gray-100 p-4 rounded-lg shadow-md">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6 max-w-xl mx-auto bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-center">Update Your Profile</h2>
                        <p className="mb-4"><strong>Email:</strong> {user.email}</p>

                       
                        

                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Shop Name<span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                defaultValue={user.shopName}
                                {...register("shopName", { required: "Shop name is required" })}
                                className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.shopName ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.shopName && <p className="text-red-500 text-sm mt-1">{errors.shopName.message}</p>}
                        </div>

                        {/* Mobile Number */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Mobile Number<span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                defaultValue={user.mobileNo}
                                {...register("mobileNo", {
                                    required: "Mobile number is required",
                                    pattern: {
                                        value: /^[6-9]\d{9}$/,
                                        message: "Enter a valid 10-digit mobile number"
                                    }
                                })}
                                className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.mobileNo ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.mobileNo && <p className="text-red-500 text-sm mt-1">{errors.mobileNo.message}</p>}
                        </div>

                        {/* GSTIN */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">GSTIN</label>
                            <input
                                type="text"
                                defaultValue={user.gstin}
                                {...register("gstin", {
                                    pattern: {
                                        value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                                        message: "Enter a valid GSTIN"
                                    }
                                })}
                                className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.gstin ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.gstin && <p className="text-red-500 text-sm mt-1">{errors.gstin.message}</p>}
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Address</label>
                            <textarea
                                rows={3}
                                defaultValue={user.address}
                                {...register("address")}
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Owner Name */}
                        <div>
                            <label className="block mb-1 font-medium text-gray-700">Owner Name<span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                defaultValue={user.ownerName}
                                {...register("ownerName", { required: "Owner name is required" })}
                                className={`w-full border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.ownerName ? 'border-red-500' : 'border-gray-300'}`}
                            />
                            {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName.message}</p>}
                        </div>

                        <div className="text-center">
                            <button
                                type="submit"
                                disabled={!isDirty || isUpdating}
                                className={`bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full transition ${(!isDirty || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>

                            {updateStatus.success !== null && (
                                <p className={`mt-3 ${updateStatus.success ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {updateStatus.success ? '✅ ' : '❌ '}{updateStatus.message}
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Page;