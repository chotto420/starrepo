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
        burstPosition: { left: number } | null;
        burstRotation: number | null;
    } | null>(null);

    const lastMascotRef = useRef<string | null>(null);
    const burstTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (mascot && !mascot.isBursting) {
            // Get the current position of the element
            const rect = e.currentTarget.getBoundingClientRect();
            const containerRect = e.currentTarget.parentElement?.getBoundingClientRect();

            // Calculate the left position relative to the container
            const leftPosition = containerRect
                ? rect.left - containerRect.left
                : rect.left;

            // Get the current rotation from computed style
            const computedStyle = window.getComputedStyle(e.currentTarget);
            const transform = computedStyle.transform;
            let currentRotation = 0;

            if (transform && transform !== 'none') {
                // Parse the matrix to get rotation angle
                const values = transform.split('(')[1]?.split(')')[0]?.split(',');
                if (values && values.length >= 2) {
                    const a = parseFloat(values[0]);
                    const b = parseFloat(values[1]);
                    currentRotation = Math.round(Math.atan2(b, a) * (180 / Math.PI));
                }
            }

            // Trigger burst animation with frozen position and rotation
            setMascot(prev => prev ? {
                ...prev,
                isBursting: true,
                burstPosition: { left: leftPosition },
                burstRotation: currentRotation
            } : null);

            // Remove mascot after burst animation completes (400ms)
            burstTimeoutRef.current = setTimeout(() => {
                setMascot(null);
            }, 400);
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
                burstPosition: null,
                burstRotation: null,
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

    // When bursting, use fixed position and rotation instead of animation
    const burstStyle = mascot.isBursting && mascot.burstPosition ? {
        top: `${mascot.top}%`,
        left: `${mascot.burstPosition.left}px`,
        transform: `rotate(${mascot.burstRotation || 0}deg)`,
    } : {
        top: `${mascot.top}%`,
    };

    return (
        <Image
            key={mascot.key}
            src={mascot.src}
            alt=""
            width={48}
            height={48}
            className={`rolling-mascot ${mascot.isBursting ? 'mascot-burst' : ''}`}
            style={burstStyle}
            onClick={handleClick}
        />
    );
}
