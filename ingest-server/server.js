const { WebSocketServer } = require('ws');
const { PassThrough } = require('stream');
const tus = require('tus-js-client');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

console.log(`Ingest server running on ws://0.0.0.0:${PORT}`);

wss.on('connection', (ws) => {
  let passThrough = null;
  let upload = null;
  let isFinalizing = false;

  console.log('Client connected');

  ws.on('message', (message, isBinary) => {
    if (!isBinary) {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'START') {
          console.log(`Starting upload for user: ${data.userId}`);
          passThrough = new PassThrough();
          const fileName = `${data.userId}/${Date.now()}.webm`;
          
          upload = new tus.Upload(passThrough, {
            endpoint: `${process.env.SUPABASE_URL}/storage/v1/upload/resumable`,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${data.token}`,
              'x-upsert': 'true'
            },
            uploadLengthDeferred: true,
            metadata: {
              bucketName: 'clipad_videos',
              objectName: fileName,
              contentType: 'video/webm',
              cacheControl: '3600',
            },
            onError: (error) => {
              console.error("TUS error:", error);
              ws.send(JSON.stringify({ type: 'ERROR', error: error.message }));
            },
            onSuccess: () => {
              console.log("Upload finished:", fileName);
              ws.send(JSON.stringify({ type: 'SUCCESS', fileName: fileName }));
            }
          });
          upload.start();
        } else if (data.type === 'END') {
          console.log("End signal received.");
          if (passThrough && !isFinalizing) {
            isFinalizing = true;
            passThrough.end(); // close stream, triggering upload completion
          }
        }
      } catch (err) {
        console.error("Message error:", err);
      }
    } else {
      // Binary chunk
      if (passThrough && !isFinalizing) {
        passThrough.write(message);
      }
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (passThrough && !isFinalizing) {
      isFinalizing = true;
      passThrough.end();
    }
  });
});
