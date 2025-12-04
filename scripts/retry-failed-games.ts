// Retry failed games with longer delays to avoid rate limiting
// Run with: npx tsx scripts/retry-failed-games.ts

const FAILED_GAME_IDS = [
    286090429,    // Arsenal (failed on first attempt)
    4623386862,   // Piggy
    606849621,    // Jailbreak
    292439477,    // Phantom Forces
    370731277,    // MeepCity
    189707,       // Natural Disaster Survival
    16732694052,  // Fisch
    155615604,    // Prison Life
    1224212277,   // Mad City (failed on first attempt)
    2202352383,   // Super Hero Tycoon
    10449761463,  // Blade Ball
    6678877691,   // Mega Easy Obby
    3956818381,   // Ability Wars
];

async function retryFailedGames() {
    console.log(`Retrying ${FAILED_GAME_IDS.length} failed games with 4-second delays...`);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let successCount = 0;
    let errorCount = 0;
    let alreadyExistsCount = 0;

    for (let i = 0; i < FAILED_GAME_IDS.length; i++) {
        const placeId = FAILED_GAME_IDS[i];
        console.log(`\n[${i + 1}/${FAILED_GAME_IDS.length}] Registering Place ID: ${placeId}...`);

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

            // Wait 4 seconds between requests to avoid rate limiting
            if (i < FAILED_GAME_IDS.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 4000));
            }
        } catch (error) {
            console.error(`✗ Failed to register: ${error}`);
            errorCount++;
        }
    }

    console.log('\n--- Retry Complete ---');
    console.log(`✓ Successfully registered: ${successCount}`);
    console.log(`ℹ Already existed: ${alreadyExistsCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`Total processed: ${FAILED_GAME_IDS.length}`);
}

retryFailedGames().catch(console.error);
