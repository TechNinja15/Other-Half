
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const app = express();
let port = parseInt(process.env.PORT || '5000', 10);

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Other Half API is running');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Create server and handle error if port is in use
const server = http.createServer(app);

const startServer = (portToTry) => {
  server.listen(portToTry, () => {
    console.log(`Server running on port ${portToTry}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} is busy, trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error(err);
    }
  });
};

startServer(port);
