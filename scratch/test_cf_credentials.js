const token = "cfut_HL8jwGl2nmOaispkewTLYyjyxSmQ1WxVI05GxNuC3904c884";
const accountId = "ecc763fd961d74ed5304e74850b2012f";

async function test() {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`;
  console.log("Testing Cloudflare API...");
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: "ping" }]
      })
    });
    console.log("Status:", resp.status);
    console.log("Response:", await resp.text());
  } catch (err) {
    console.error("Error:", err.message);
  }
}

test();
