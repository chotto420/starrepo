export interface RobloxGameData {
    placeId: number;
    universeId: number;
    name: string;
    description: string;
    creatorName: string;
    visits: number;
    playing: number;
    favorites: number;
    upVotes: number;
    downVotes: number;
    created: string;
    updated: string;
    iconUrl: string | null;
    thumbnailUrl: string | null;
    price: number | null;
    genre: string | null;
}

export async function getRobloxGameData(placeId: number): Promise<RobloxGameData | null> {
    try {
        // 1. Get Universe ID
        const uRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
        if (!uRes.ok) {
            console.error(`[Roblox API] Universe fetch failed for ${placeId}: ${uRes.status} ${uRes.statusText}`);
            return null;
        }
        const { universeId } = await uRes.json();

        // 2. Get Game Info
        const gRes = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
        if (!gRes.ok) {
            console.error(`[Roblox API] Game fetch failed for universe ${universeId}: ${gRes.status} ${gRes.statusText}`);
            return null;
        }
        const gameData = (await gRes.json()).data[0];
        if (!gameData) {
            console.error(`[Roblox API] No game data found for universe ${universeId}`);
            return null;
        }

        // 3. Get Votes
        const vRes = await fetch(`https://games.roblox.com/v1/games/votes?universeIds=${universeId}`);
        const voteData = vRes.ok ? (await vRes.json()).data[0] : { upVotes: 0, downVotes: 0 };

        // 4. Get Icon
        const iRes = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`);
        const iconUrl = iRes.ok ? (await iRes.json()).data?.[0]?.imageUrl : null;

        // 5. Get Thumbnail
        const tRes = await fetch(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&size=768x432&format=Png`);
        const thumbnailUrl = tRes.ok ? (await tRes.json()).data?.[0]?.thumbnails?.[0]?.imageUrl : null;

        return {
            placeId,
            universeId,
            name: gameData.name,
            description: gameData.description,
            creatorName: gameData.creator?.name || "Unknown",
            visits: gameData.visits,
            playing: gameData.playing,
            favorites: gameData.favoritedCount,
            upVotes: voteData.upVotes,
            downVotes: voteData.downVotes,
            created: gameData.created,
            updated: gameData.updated,
            iconUrl,
            thumbnailUrl,
            price: gameData.price,
            genre: gameData.genre, // Use the string genre directly
        };
    } catch (error) {
        console.error(`[Roblox API] Exception for placeId ${placeId}:`, error);
        return null;
    }
}

// Genre mapping (String to Japanese)
export const GENRE_MAP: Record<string, string> = {
    "All": "その他",
    "Tutorial": "チュートリアル",
    "Scifi": "SF",
    "Town and City": "タウン＆都市",
    "Comedy": "コメディ",
    "RPG": "RPG",
    "Fighting": "格闘",
    "Horror": "ホラー",
    "Naval": "海軍",
    "Adventure": "アドベンチャー",
    "Sports": "スポーツ",
    "FPS": "FPS",
    "Western": "西部劇",
    "Building": "建築",
    "Military": "軍事",
    "Skate Park": "スケート",
    "Club": "クラブ",
};

export function getGenreName(genre: string | number | null): string {
    if (!genre) return "その他";
    const key = String(genre);
    return GENRE_MAP[key] || "その他"; // Return "その他" for unmapped genres
}

export function getAllGenres(): Array<{ id: string; name: string }> {
    return Object.entries(GENRE_MAP).map(([id, name]) => ({
        id,
        name,
    }));
}
