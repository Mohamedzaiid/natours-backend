const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message, err.stack);
  console.log('UNCAUGHT EXCEPTION!💥 Shutting Down...');
  process.exit(1);
});
dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000;

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION!💥 Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
