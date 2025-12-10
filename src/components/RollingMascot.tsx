"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// Regular mascots (equal probability)
const REGULAR_MASCOTS = [
    "/images/creators/member_katsuwo.png",    // Red
    "/images/creators/member_daisuke.png",    // Blue
    "/images/creators/member_kota.png",       // Yellow
    "/images/creators/mascot_orange.png",     // Orange
    "/images/creators/mascot_pink.png",       // Pink
];

// Rare original mascot (5% chance)
const RARE_MASCOT = "/images/creators/mascot_original.png";
const RARE_CHANCE = 0.05; // 5% probability

export default function RollingMascot() {
    const [mascot, setMascot] = useState<{
        src: string;
        top: number;
        key: number;
        isBursting: boolean;
    } | null>(null);

    const lastMascotRef = useRef<string | null>(null);
    const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleClick = () => {
        if (mascot && !mascot.isBursting) {
            // Trigger burst animation
            setMascot(prev => prev ? { ...prev, isBursting: true } : null);

            // Remove mascot after burst animation completes (300ms)
            burstTimeoutRef.current = setTimeout(() => {
                setMascot(null);
            }, 300);
        }
    };

    useEffect(() => {
        // Initial delay before first mascot (10-20 seconds after page load)
        const initialDelay = 10000 + Math.random() * 10000;

        let timeoutId: NodeJS.Timeout;

        const spawnMascot = () => {
            let selectedSrc: string;

            // 5% chance for rare original mascot
            if (Math.random() < RARE_CHANCE) {
                selectedSrc = RARE_MASCOT;
            } else {
                // Pick a random mascot that's different from the last one
                let availableMascots = REGULAR_MASCOTS.filter(m => m !== lastMascotRef.current);
                if (availableMascots.length === 0) {
                    availableMascots = REGULAR_MASCOTS;
                }
                selectedSrc = availableMascots[Math.floor(Math.random() * availableMascots.length)];
            }

            lastMascotRef.current = selectedSrc;

            // Random Y position (10% - 70% from top)
            const randomTop = 10 + Math.random() * 60;

            setMascot({
                src: selectedSrc,
                top: randomTop,
                key: Date.now(),
                isBursting: false,
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
            if (burstTimeoutRef.current) {
                clearTimeout(burstTimeoutRef.current);
            }
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
            className={`rolling-mascot ${mascot.isBursting ? 'mascot-burst' : ''}`}
            style={{ top: `${mascot.top}%` }}
            onClick={handleClick}
        />
    );
}
