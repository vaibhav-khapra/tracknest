"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react"
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = (props) => {
    const { data: session } = useSession()
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const navLinks = !session ? [
        { name: 'Home', href: '/' },
        { name: 'Features', href: '/features' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Contact', href: '/contact' },
    ] : [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Profile', href: '/profile' },
        { name: 'Add Items', href: '/additems' },
        { name: 'All Items', href: '/allitems' },
        { name: 'Create Bill', href: '/createbill' },
    ];

    return (
        <>
            <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${
                scrolled 
                    ? 'bg-white/95 backdrop-blur-md shadow-lg' 
                    : 'bg-white/80 backdrop-blur-sm shadow-sm'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex-shrink-0"
                        >
                            <Link href="/" className="flex items-center space-x-2 group">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transform rotate-45 group-hover:rotate-90 transition-transform duration-300"></div>
                                <span className="font-bold text-xl md:text-2xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                    Tracknest
                                </span>
                            </Link>
                        </motion.div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        className="relative px-4 py-2 text-gray-700 font-medium transition-colors hover:text-blue-600 group"
                                    >
                                        {link.name}
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                    </Link>
                                </motion.div>
                            ))}
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                {!session ? (
                                    <button
                                        onClick={() => signIn()}
                                        className="ml-4 px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 transition-all duration-300"
                                    >
                                        Get Started
                                    </button>
                                ) : (
                                    <div className="flex items-center space-x-4 ml-4">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                            {session.user?.email?.[0].toUpperCase()}
                                        </div>
                                        <button
                                            onClick={() => signOut()}
                                            className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-600 font-semibold hover:bg-red-500 hover:text-white transition-all duration-300"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
                                aria-label="Toggle menu"
                            >
                                <div className="relative w-6 h-6">
                                    <span className={`absolute h-0.5 w-6 bg-gray-800 transform transition-all duration-300 ${
                                        isMenuOpen ? 'rotate-45 top-3' : 'top-1'
                                    }`}></span>
                                    <span className={`absolute h-0.5 w-6 bg-gray-800 top-3 transition-all duration-300 ${
                                        isMenuOpen ? 'opacity-0' : 'opacity-100'
                                    }`}></span>
                                    <span className={`absolute h-0.5 w-6 bg-gray-800 transform transition-all duration-300 ${
                                        isMenuOpen ? '-rotate-45 top-3' : 'top-5'
                                    }`}></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 overflow-hidden"
                        >
                            <div className="px-4 py-4 space-y-1">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.name}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                ))}
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="pt-4"
                                >
                                    {!session ? (
                                        <button
                                            onClick={() => {
                                                signIn();
                                                setIsMenuOpen(false);
                                            }}
                                            className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                                        >
                                            Get Started
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    {session.user?.email?.[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {session.user?.name || 'User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {session.user?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    signOut();
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full px-6 py-3 rounded-full border-2 border-red-500 text-red-600 font-semibold hover:bg-red-500 hover:text-white transition-all duration-300"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Spacer to prevent content from hiding under navbar */}
            <div className="h-16 md:h-20"></div>
        </>
    );
};

export default Navbar;