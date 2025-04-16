const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '..', 'data', 'products.json');
const foundersPath = path.join(__dirname, '..', 'data', 'founders.json');

// Helper function to read JSON file
function readJsonFile(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return { products: [], founders: [] };
    }
}

// Helper function to write JSON file
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
    }
}

// Get all products
function getAllProducts() {
    const data = readJsonFile(productsPath);
    return data.products || [];
}

// Get product by ID
function getProductById(id) {
    const products = getAllProducts();
    return products.find(product => product.id === id);
}

// Get all founders
function getAllFounders() {
    const data = readJsonFile(foundersPath);
    let founders = data.founders || [];
    // Ensure all founders have a products array
    founders = founders.map(founder => ({
        ...founder,
        products: founder.products || []
    }));
    return founders;
}

// Get founder by ID
function getFounderById(id) {
    const founders = getAllFounders();
    return founders.find(founder => founder.id === id);
}

// Get products by founder ID
function getProductsByFounderId(founderId) {
    const products = getAllProducts();
    return products.filter(product => product.founderId === founderId);
}

// Add new product
function addProduct(productData) {
    const data = readJsonFile('products.json');
    const newProduct = {
        id: `product${data.products.length + 1}`,
        ...productData
    };
    data.products.push(newProduct);
    writeJsonFile('products.json', data);
    return newProduct;
}

// Add new founder
function addFounder(founderData) {
    const data = readJsonFile('founders.json');
    const newFounder = {
        id: `founder${data.founders.length + 1}`,
        ...founderData
    };
    data.founders.push(newFounder);
    writeJsonFile('founders.json', data);
    return newFounder;
}

// Save products
function saveProducts(products) {
    const data = { products };
    writeJsonFile(productsPath, data);
}

// Save founders
function saveFounders(founders) {
    const data = { founders };
    writeJsonFile(foundersPath, data);
}

module.exports = {
    getAllProducts,
    getProductById,
    getAllFounders,
    getFounderById,
    getProductsByFounderId,
    addProduct,
    addFounder,
    saveProducts,
    saveFounders
}; 