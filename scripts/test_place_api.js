
// Test if we can use Place ID directly instead of Universe ID
const placeId = 2753915549; // Blox Fruits

async function testPlaceIdAPI() {
    console.log("Testing Place ID direct API...\n");

    // Test 1: multiget-place-details (Place ID based)
    console.log("1. Testing multiget-place-details:");
    const detailsRes = await fetch(
        `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`
    );
    if (detailsRes.ok) {
        const data = await detailsRes.json();
        console.log("✅ Success! Data:", JSON.stringify(data, null, 2));
    } else {
        console.log(`❌ Failed: ${detailsRes.status}`);
    }
}

testPlaceIdAPI();
