
import dns from 'node:dns';

console.log('Testing DNS resolution for universes.roblox.com...');

dns.lookup('universes.roblox.com', (err, address, family) => {
    if (err) {
        console.error('DNS Lookup failed:', err);
    } else {
        console.log(`DNS Resolved: ${address} (Family: IPv${family})`);
    }
});

console.log('Testing fetch to universes.roblox.com...');

// @ts-ignore
fetch('https://universes.roblox.com/v1/places/123821081589134/universe')
    .then(res => {
        console.log(`Fetch Status: ${res.status}`);
        return res.text();
    })
    .then(text => {
        console.log('Fetch Response Length:', text.length);
        console.log('Fetch Response Snippet:', text.substring(0, 100));
    })
    .catch(err => {
        console.error('Fetch Check failed:', err);
    });
