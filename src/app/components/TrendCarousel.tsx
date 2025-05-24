"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import RatingStars from "@/components/RatingStars";

export interface TrendCarouselProps {
  places: {
    id: string;
    name: string;
    thumbnailUrl: string;
    avgRating: number;
    reviewCount: number;
    isHot: boolean;
  }[];
  className?: string;
}

export default function TrendCarousel({ places, className }: TrendCarouselProps) {
  const router = useRouter();
  return (
    <div className={`overflow-x-auto ${className || ""}`}>
      <div className="flex gap-4 pb-2 no-scrollbar">
        {places.map((p) => (
          <div
            key={p.id}
            className="relative w-48 shrink-0 cursor-pointer"
            onClick={() => router.push(`/place/${p.id}`)}
          >
            <div className="relative w-full h-36">
              <Image
                src={p.thumbnailUrl}
                alt={p.name}
                fill
                className="object-cover rounded-lg"
              />
            </div>
            {p.isHot && (
              <span className="absolute top-1 left-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                HOT
              </span>
            )}
            <h3 className="mt-2 text-sm font-semibold truncate">{p.name}</h3>
            <div className="flex items-center gap-1 text-xs">
              <RatingStars rating={p.avgRating} />
              <span>({p.reviewCount})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
