
// 以下のコードをブラウザのコンソール(F12)に貼り付けて実行してください。
// Robloxのページ（例: https://www.roblox.com/home）を開いた状態で実行してください。
// 実行後、自動的に結果のJSONがクリップボードにコピーされます。
// "Done! Data copied to clipboard." と表示されるまでページを閉じないでください。

(async () => {
    // 検証用: 5件のみ
    const placeIds = [
        123821081589134,
        16883974868,
        134236244017051,
        79657240466394,
        112279762578792
    ];

    console.log(`Starting to fetch ${placeIds.length} places...`);
    const results = [];

    // ヘルパー: 直列実行でAPIを叩く
    for (const pid of placeIds) {
        try {
            // 1. Universe ID取得
            const res1 = await fetch(`https://universes.roblox.com/v1/places/${pid}/universe`);
            if (!res1.ok) {
                console.warn(`Place ${pid} (UniverseId) Error: ${res1.status}`);
                continue;
            }
            const data1 = await res1.json();
            const universeId = data1.universeId;

            // 2. 詳細取得
            const res2 = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
            if (!res2.ok) {
                console.warn(`Place ${pid} (Details) Error: ${res2.status}`);
                continue;
            }
            const data2 = await res2.json();
            const universe = data2.data[0];

            // 3. サムネイル取得
            const res3 = await fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png&isCircular=false`);
            let thumbnail = null;
            if (res3.ok) {
                const data3 = await res3.json();
                thumbnail = data3.data[0].imageUrl;
            }

            results.push({
                place_id: pid,
                name: universe.name,
                description: universe.description || "",
                url: `https://www.roblox.com/games/${pid}`,
                creator_name: universe.creator.name,
                visit_count: universe.visits || 0,
                favorite_count: universe.favoritedCount || 0,
                playing: universe.playing || 0,
                genre: universe.genre || "All",
                thumbnail_url: thumbnail || null,
                created_at: universe.created,
                updated_at: universe.updated,
            });

            console.log(`[${results.length}] Fetched: ${universe.name}`);

            // 200ms待機
            await new Promise(r => setTimeout(r, 200));

        } catch (e) {
            console.error(`Error fetching ${pid}:`, e);
            // ネットワークエラー系なら少し長く待つ
            await new Promise(r => setTimeout(r, 500));
        }
    }

    const jsonStr = JSON.stringify(results, null, 2);
    // クリップボードにコピー
    copy(jsonStr);
    console.log("------------------------------------------");
    console.log("Done! Data copied to clipboard.");
    console.log("Please save this content to 'scripts/place_data.json' in the project.");
})();
