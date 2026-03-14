
const BASE_URL = 'http://localhost:3000';

async function testApi() {
  console.log('--- Starting API Verification ---');
  
  // 1. Test Auth (Register) - This might fail if user exists, handle gracefully
  // Generate random phone to avoid conflict
  const phone = '99999' + Math.floor(10000 + Math.random() * 90000);
  console.log(`Testing with phone: ${phone}`);

  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', phone }),
    });
    console.log(`Register Status: ${regRes.status}`);
    if (!regRes.ok) console.error(await regRes.text());
  } catch (e) {
    console.error('Register Failed', e);
  }

  // 2. Test Auth (Login)
  try {
      const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      console.log(`Login Status: ${loginRes.status}`);
      // Expect 404 because user created above isn't verified yet! 
      // User is only created on Verify step in our logic.
      // So this 404 is actually CORRECT behavior for the first time.
  } catch(e) {
      console.error('Login Failed', e);
  }

  // 3. Test Matches List (Public)
  try {
    const matchesRes = await fetch(`${BASE_URL}/api/matches`);
    console.log(`Get Matches Status: ${matchesRes.status}`);
    if (matchesRes.ok) {
        const matches = await matchesRes.json();
        console.log(`Matches found: ${matches.length}`);
    } else {
        console.error(await matchesRes.text());
    }
  } catch (e) {
    console.error('Get Matches Failed', e);
  }

  console.log('--- Verification Complete ---');
}

testApi();
