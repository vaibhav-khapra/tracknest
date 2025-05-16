"use client"
import { useEffect, useState } from "react";

const images = [
    "/tracknest-1.png",
    "/tracknest-2.png",
    "/tracknest-3.png",
    "/tracknest-4.png",
    "/tracknest-5.png",
    "/tracknest-6.png",
    "/tracknest-7.png",
    "/tracknest-8.png",
];

export default function Images() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === images.length - 1 ? 0 : prevIndex + 1
            );
        }, 3000); 

        return () => clearInterval(interval); 
    }, []);

    return (
        <div className="w-full md:w-1/2 relative">
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl">
                <img
                    src={images[currentIndex]}
                    alt="Inventory"
                    className="w-full h-full object-contain transition-opacity duration-1000"
                />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg hidden md:block">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm font-medium">Live Inventory Tracking</span>
                </div>
            </div>
        </div>
    );
}
