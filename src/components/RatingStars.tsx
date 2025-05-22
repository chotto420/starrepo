"use client";

interface Props {
  rating: number;
}

export default function RatingStars({ rating }: Props) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rounded ? "text-yellow-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
    </div>
  );
}

