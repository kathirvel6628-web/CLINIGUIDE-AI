const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const prescriptionRoutes = require('./src/routes/prescriptions');
const reminderRoutes = require('./src/routes/reminders');
const sosRoutes = require('./src/routes/sos');
const errorHandler = require('./src/middleware/errorHandler');
const { startScheduler } = require('./src/services/schedulerService');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/sos', sosRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CliniGuide AI backend running on http://localhost:${PORT}`);
  startScheduler();
});
