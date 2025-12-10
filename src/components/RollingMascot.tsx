"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const MASCOTS = [
    "/images/creators/member_katsuwo.png",
    "/images/creators/member_daisuke.png",
    "/images/creators/member_kota.png",
];

export default function RollingMascot() {
    const [mascot, setMascot] = useState<{
        src: string;
        top: number;
        key: number;
    } | null>(null);

    useEffect(() => {
        // Initial delay before first mascot (10-20 seconds after page load)
        const initialDelay = 10000 + Math.random() * 10000;

        let timeoutId: NodeJS.Timeout;

        const spawnMascot = () => {
            // Random mascot
            const randomSrc = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
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
