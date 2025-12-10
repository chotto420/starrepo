"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const MASCOTS = [
    "/images/creators/member_katsuwo.png",    // Red
    "/images/creators/member_daisuke.png",    // Blue
    "/images/creators/member_kota.png",       // Yellow
    "/images/creators/mascot_orange.png",     // Orange
    "/images/creators/mascot_pink.png",       // Pink
];

export default function RollingMascot() {
    const [mascot, setMascot] = useState<{
        src: string;
        top: number;
        key: number;
    } | null>(null);

    const lastMascotRef = useRef<string | null>(null);

    useEffect(() => {
        // Initial delay before first mascot (10-20 seconds after page load)
        const initialDelay = 10000 + Math.random() * 10000;

        let timeoutId: NodeJS.Timeout;

        const spawnMascot = () => {
            // Pick a random mascot that's different from the last one
            let availableMascots = MASCOTS.filter(m => m !== lastMascotRef.current);
            if (availableMascots.length === 0) {
                availableMascots = MASCOTS; // Fallback if filter removes all
            }
            const randomSrc = availableMascots[Math.floor(Math.random() * availableMascots.length)];
            lastMascotRef.current = randomSrc;

            // Random Y position (10% - 70% from top)
            const randomTop = 10 + Math.random() * 60;

            setMascot({
                src: randomSrc,
                top: randomTop,
                key: Date.now(),
            });

            // Clear mascot after animation completes (12 seconds)
            setTimeout(() => {
                setMascot(null);
            }, 12000);

            // Schedule next mascot (20-40 seconds interval)
            const nextDelay = 20000 + Math.random() * 20000;
            timeoutId = setTimeout(spawnMascot, nextDelay);
        };

        // Start the first mascot after initial delay
        timeoutId = setTimeout(spawnMascot, initialDelay);

        return () => {
            clearTimeout(timeoutId);
        };
    }, []);

    if (!mascot) return null;

    return (
        <Image
            key={mascot.key}
            src={mascot.src}
            alt=""
            width={48}
            height={48}
            className="rolling-mascot"
            style={{ top: `${mascot.top}%` }}
        />
    );
}
