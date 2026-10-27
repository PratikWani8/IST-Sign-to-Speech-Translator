const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');

let server;

const startServer = async () => {
  // Initialize Database connection
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`[Express Backend] Server running on port ${PORT}`);
    console.log(`[Express Backend] API available at http://localhost:${PORT}/api`);
  });

  const gracefulShutdown = () => {
    console.log('[Express Backend] Received kill signal, shutting down gracefully...');
    if (server) {
      server.close(() => {
        console.log('[Express Backend] Closed out remaining connections.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
