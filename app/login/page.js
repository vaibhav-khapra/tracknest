'use client'
import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import { useForm } from "react-hook-form";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from "next-auth/react"

const LoginPage = () => {
    const router = useRouter();
    const { data: session } = useSession()
    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        if (session?.user) {
            router.push('/dashboard');
        }
    }, [session, router]);

    return (
        <>
            <div className='min-h-screen '>
            <Navbar />
            <div className="min-h-screen max-h-screen  bg-gradient-to-br mt-[90px] from-blue-50 to-indigo-100">
                <div className="container mx-auto px-4 py-12">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
                        
                        <div className="w-full lg:w-1/2 max-w-lg">
                            <div className="bg-white p-8 rounded-2xl shadow-lg">
                                <div className="flex items-center justify-center mb-6">
                                   
                                    <h1 className="text-3xl font-bold text-indigo-700">TrackNest</h1>
                                </div>

                                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                                    Streamline Your Inventory Management
                                </h2>
                                <p className="text-gray-600 mb-8">
                                    Take control of your stock with real-time tracking, automated alerts,
                                    and powerful analytics - all in one intuitive platform.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="ml-3 text-gray-700">Low stock alerts</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="ml-3 text-gray-700">Expiry date tracking</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 bg-indigo-100 p-2 rounded-full">
                                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="ml-3 text-gray-700">Real-time analytics</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                       
                        <div className="w-full lg:w-1/2 max-w-md">
                            <div className="bg-white p-8 rounded-2xl shadow-lg">
                                <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back</h2>
                                <p className="text-gray-600 mb-8">Sign in to access your dashboard</p>

                               
                                <button
                                    onClick={() => signIn("google")}
                                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors mb-6"
                                >
                                    <Image
                                        width={20}
                                        height={20}
                                        src="https://www.svgrepo.com/show/475656/google-color.svg"
                                        alt="Google logo"
                                    />
                                    <span className="text-gray-700 font-medium">Continue with Google</span>
                                </button>

                                <div className="flex items-center mb-6">
                                    <div className="flex-grow border-t border-gray-300"></div>
                                    <span className="mx-4 text-gray-500">or</span>
                                    <div className="flex-grow border-t border-gray-300"></div>
                                </div>

                              
                                <form  className="space-y-4">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            {...register("email", { required: true })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="your@email.com"
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-600">Email is required</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                            Password
                                        </label>
                                        <input
                                            id="password"
                                            type="password"
                                            {...register("password", { required: true })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="••••••••"
                                        />
                                        {errors.password && <p className="mt-1 text-sm text-red-600">Password is required</p>}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <input
                                                id="remember-me"
                                                name="remember-me"
                                                type="checkbox"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                                                Remember me
                                            </label>
                                        </div>

                                        <div className="text-sm">
                                            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                                                Forgot password?
                                            </a>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                    >
                                        Sign in
                                    </button>
                                </form>

                                <div className="mt-6 text-center text-sm">
                                    <p className="text-gray-600">
                                        Don't have an account?{' '}
                                        <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                                            Sign up
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </>
    );
}

export default LoginPage;