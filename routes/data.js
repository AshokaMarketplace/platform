const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    getAllFounders,
    getFounderById,
    getProductsByFounderId,
    addProduct,
    addFounder
} = require('../utils/dataManager');

// Get all products
router.get('/products', (req, res) => {
    const products = getAllProducts();
    res.json(products);
});

// Get product by ID
router.get('/products/:id', (req, res) => {
    const product = getProductById(req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Get all founders
router.get('/founders', (req, res) => {
    const founders = getAllFounders();
    res.json(founders);
});

// Get founder by ID
router.get('/founders/:id', (req, res) => {
    const founder = getFounderById(req.params.id);
    if (founder) {
        res.json(founder);
    } else {
        res.status(404).json({ error: 'Founder not found' });
    }
});

// Get products by founder ID
router.get('/founders/:id/products', (req, res) => {
    const products = getProductsByFounderId(req.params.id);
    res.json(products);
});

// Add new product
router.post('/products', (req, res) => {
    try {
        const newProduct = addProduct(req.body);
        res.json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Error adding product' });
    }
});

// Add new founder
router.post('/founders', (req, res) => {
    try {
        const newFounder = addFounder(req.body);
        res.json(newFounder);
    } catch (error) {
        res.status(500).json({ error: 'Error adding founder' });
    }
});

module.exports = router; 