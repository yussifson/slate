async function testAI() {
  const token = "cfut_DjZLCGykcMI0D0wtJIHxOME8NpAIwe68bLYMsyWOd091300e";
  const accountId = "bf5126510c1f8f2759cc81c4e7d795ef";
  const model = "@cf/moonshotai/kimi-k2.5";
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        messages: [
          { role: "system", content: "You are a bot" },
          { role: "user", content: "Say hi" }
        ], 
        max_tokens: 2500 
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error(e);
  }
}

testAI();
