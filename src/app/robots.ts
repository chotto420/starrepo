import { MetadataRoute } from "next";

const BASE_URL = "https://starrepo.net";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/admin/", "/mypage/"],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
