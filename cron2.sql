SELECT cron.unschedule('keep-render-alive-cron'); SELECT cron.schedule('keep-render-alive-cron', '*/14 * * * *', 'select net.http_get(''https://slate-gcph.onrender.com/health'');');
