const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Import the route files and pass the database pool to them
const staffRoute = require('./routes/Staff')(pool);
const menuRoute = require('./routes/Menu')(pool);
const categoryRoute = require('./routes/Categories')(pool);
const recipeRoute = require('./routes/Recipes')(pool);
const ingredientRoute = require('./routes/Ingredients')(pool);
const supplierRoute = require('./routes/Suppliers')(pool);

// Link the files to base URLs
app.use('/api/staffs', staffRoute);
app.use('/api/menus', menuRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/suppliers', supplierRoute);
app.use('/api/recipes', recipeRoute);
app.use('/api/ingredients', ingredientRoute);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));