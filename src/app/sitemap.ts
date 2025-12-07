import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = "https://starrepo.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = await createClient();

    // Fetch all places for dynamic routes
    const { data: places } = await supabase
        .from("places")
        .select("place_id, updated_at")
        .order("updated_at", { ascending: false });

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${BASE_URL}/ranking`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/genre`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/search`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
        },
    ];

    // Dynamic game pages
    const gamePages: MetadataRoute.Sitemap = (places || []).map((place) => ({
        url: `${BASE_URL}/place/${place.place_id}`,
        lastModified: new Date(place.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
    }));

    return [...staticPages, ...gamePages];
}
