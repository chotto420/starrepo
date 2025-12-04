// Script to seed the database with popular Roblox games
// Run with: npx tsx scripts/seed-games.ts

const POPULAR_GAME_IDS = [
    // Top games
    920587237,    // Adopt Me!
    4924922222,   // Brookhaven RP
    1962086868,   // Tower of Hell
    2753915549,   // Blox Fruits
    142823291,    // Murder Mystery 2
    286090429,    // Arsenal
    4623386862,   // Piggy
    606849621,    // Jailbreak
    292439477,    // Phantom Forces
    370731277,    // MeepCity

    // Popular games
    189707,       // Natural Disaster Survival
    16732694052,  // Fisch
    155615604,    // Prison Life
    1224212277,   // Mad City
    2202352383,   // Super Hero Tycoon
    2414851778,   // RIVALS
    5130598377,   // The Strongest Battlegrounds
    10449761463,  // Blade Ball
    6678877691,   // Mega Easy Obby
    3956818381,   // Ability Wars

    // More popular games
    4669040,      // Zombie Attack
    537413528,    // Build A Boat For Treasure
    4282985734,   // Shindo Life
    3101667897,   // Legends of Speed
    318978013,    // Dungeon Quest
    347472790,    // Work at a Pizza Place
    461180963,    // Lumber Tycoon 2
    2619187362,   // Dragon Adventures
    2041312716,   // Ragdoll Engine
    286090429,    // Arsenal

    // Additional popular games
    13772394625,  // Toilet Tower Defense
    80605089605642, // Exit 8 School
    734159876,    // SharkBite
    130943445312676, // Don't call a YouTuber at 3am
    8737602449,   // PLS DONATE
    6516141723,   // DOORS
    7991339063,   // Evade
    4282985734,   // Shinobi Life 2
    3623096087,   // Royale High
    1224212277,   // Mad City
];

async function seedGames() {
    console.log(`Starting to seed ${POPULAR_GAME_IDS.length} games...`);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let successCount = 0;
    let errorCount = 0;
    let alreadyExistsCount = 0;

    for (let i = 0; i < POPULAR_GAME_IDS.length; i++) {
        const placeId = POPULAR_GAME_IDS[i];
        console.log(`\n[${i + 1}/${POPULAR_GAME_IDS.length}] Registering Place ID: ${placeId}...`);

        try {
            const response = await fetch(`${baseUrl}/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ placeId: String(placeId) }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.alreadyExists) {
                    console.log(`✓ Already exists: ${data.message}`);
                    alreadyExistsCount++;
                } else {
                    console.log(`✓ Success: ${data.gameName || 'Game registered'}`);
                    successCount++;
                }
            } else {
                console.error(`✗ Error: ${data.error}`);
                errorCount++;
            }

            // Wait a bit between requests to avoid rate limiting
            if (i < POPULAR_GAME_IDS.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (error) {
            console.error(`✗ Failed to register: ${error}`);
            errorCount++;
        }
    }

    console.log('\n--- Seeding Complete ---');
    console.log(`✓ Successfully registered: ${successCount}`);
    console.log(`ℹ Already existed: ${alreadyExistsCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`Total processed: ${POPULAR_GAME_IDS.length}`);
}

seedGames().catch(console.error);
