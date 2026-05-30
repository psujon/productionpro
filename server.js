const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5172;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const buyerRoutes = require('./server/routes/buyer.routes');
const styleRoutes = require('./server/routes/style.routes');
const productionRoutes = require('./server/routes/production.routes');
const userRoutes = require('./server/routes/user.routes');
const sectionRoutes = require('./server/routes/sections/section.routes');
const globalFetchRoutes = require('./server/routes/globalFetch.routes');
const employeeRoutes = require('./server/routes/employee.routes');
const communityRoutes = require('./server/routes/community.routes');
const ticketRoutes = require('./server/routes/ticket.routes');
const blockRoutes = require('./server/routes/block.routes');
const backupRoutes = require('./server/routes/backup.routes');
const databaseLockRoutes = require('./server/routes/databaseLock.routes');

// Mount routes
app.use('/Buyer', buyerRoutes);
app.use('/style', styleRoutes);
app.use('/styleRate', styleRoutes);
app.use('/production', productionRoutes);
app.use('/users', userRoutes);
app.use('/section', sectionRoutes);
app.use('/globalFetch', globalFetchRoutes);
app.use('/employee', employeeRoutes);
app.use('/community', communityRoutes);
app.use('/tickets', ticketRoutes);
app.use('/block', blockRoutes);
app.use('/backup', backupRoutes);
app.use('/databaseLock', databaseLockRoutes);

// Compatibility route for direct login
const userController = require('./server/controllers/user.controller');
app.post('/login', userController.login);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Production Software Backend API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
});
