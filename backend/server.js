const connectDB = require('./src/config/db');
const ensureDemoAuthData = require('./src/bootstrap/ensureDemoAuthData');
const app = require('./src/app');

require('dotenv').config({ override: true });

const start = async () => {
  await connectDB();
  await ensureDemoAuthData();
  app.get('/', (req, res) => res.send('API Running'));

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
