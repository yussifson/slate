CREATE EXTENSION IF NOT EXISTS pg_net; SELECT cron.schedule('keep-render-alive-cron', '*/14 * * * *', 'select net.http_get(''https://slate-2fli.onrender.com/health'');');
