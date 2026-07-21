const req = await fetch('https://wmabgiafwamxkcgxyhee.supabase.co/functions/v1/integration-sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    integrationId: '123',
    provider: 'github'
  })
});
console.log(req.status);
console.log(await req.text());
