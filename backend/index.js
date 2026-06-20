const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { initializeDatabase } = require('./initDb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Inventory
const ingredientRoute = require('./routes/inventory/Ingredients')(pool);
const supplierRoute = require('./routes/inventory/Suppliers')(pool);
const importRoute = require('./routes/inventory/Imports')(pool);
const importDetailRoute = require('./routes/inventory/ImportDetails')(pool);
const supplierOrderRoute = require('./routes/inventory/SupplierOrders')(pool);
const supplierOrderDetailRoute = require('./routes/inventory/SupplierOrderDetails')(pool);
const stockRoute = require('./routes/inventory/Stock')(pool);
//Menu
const menuRoute = require('./routes/menu/Menus')(pool);
const categoryRoute = require('./routes/menu/Categories')(pool);
const recipeRoute = require('./routes/menu/Recipes')(pool);
//Orders
const orderRoute = require('./routes/order/Orders')(pool);
const orderItemRoute = require('./routes/order/OrderItems')(pool);
const salesRoute = require('./routes/order/Sales')(pool);
const serviceSessionRoute = require('./routes/order/ServiceSessions')(pool);
//Staff
const staffRoute = require('./routes/staff/Staff')(pool);
//Tables
const tableRoute = require('./routes/table/Tables')(pool);


// Link the files to base URLs
app.use('/api/staffs', staffRoute);
app.use('/api/menus', menuRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/suppliers', supplierRoute);
app.use('/api/recipes', recipeRoute);
app.use('/api/ingredients', ingredientRoute);
app.use('/api/imports', importRoute);
app.use('/api/import-details', importDetailRoute);
app.use('/api/orders', orderRoute);
app.use('/api/order-items', orderItemRoute);
app.use('/api/sales', salesRoute);
app.use('/api/service-sessions', serviceSessionRoute);
app.use('/api/supply-orders', supplierOrderRoute);
app.use('/api/supply-order-details', supplierOrderDetailRoute);
app.use('/api/supplier-orders', supplierOrderRoute);
app.use('/api/supplier-order-details', supplierOrderDetailRoute);
app.use('/api/tables', tableRoute);
app.use('/api/stock', stockRoute);


const PORT = 5000;

initializeDatabase(pool)
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
