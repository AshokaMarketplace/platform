const products = require('../data/products');
const founders = require('../data/founders');
const { getAllProducts, getAllFounders, saveProducts, saveFounders } = require('./dataManager');

// Get product by ID
const getProductById = (id) => {
    const products = getAllProducts();
    return products.find(product => product.id === id);
};

// Get founder by ID
const getFounderById = (id) => {
    const founders = getAllFounders();
    return founders.find(founder => founder.id === id);
};

// Get products by founder ID
const getProductsByFounderId = (founderId) => {
    const products = getAllProducts();
    return products.filter(product => product.founderId === founderId);
};

// Get founder by product ID
const getFounderByProductId = (productId) => {
    const product = getProductById(productId);
    if (!product) return null;
    return getFounderById(product.founderId);
};

// Add new product
const addProduct = (productData) => {
    const products = getAllProducts();
    const newProduct = {
        id: `product${products.length + 1}`,
        ...productData,
        images: productData.images.map(img => img.startsWith('/') ? img : `/${img}`),
        createdAt: new Date().toISOString().split('T')[0]
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
};

// Add new founder
const addFounder = (founderData) => {
    const founders = getAllFounders();
    const newFounder = {
        id: `founder${founders.length + 1}`,
        ...founderData,
        image: founderData.image.startsWith('/') ? founderData.image : `/${founderData.image}`,
        gallery: founderData.gallery.map(img => ({
            url: img.url.startsWith('/') ? img.url : `/${img.url}`,
            caption: img.caption || ''
        })),
        joinedDate: new Date().toISOString().split('T')[0],
        products: []
    };
    founders.push(newFounder);
    saveFounders(founders);
    return newFounder;
};

// Update product
const updateProduct = (id, productData) => {
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        throw new Error('Product not found');
    }

    // Preserve existing images if no new ones are provided
    if (!productData.images) {
        productData.images = products[index].images;
    }

    const updatedProduct = {
        ...products[index],
        ...productData,
        id: id // Ensure ID remains unchanged
    };

    products[index] = updatedProduct;
    saveProducts(products);
    return updatedProduct;
};

// Update founder
const updateFounder = (id, founderData) => {
    const founders = getAllFounders();
    const index = founders.findIndex(f => f.id === id);
    if (index === -1) {
        throw new Error('Founder not found');
    }

    // Preserve existing images if no new ones are provided
    if (!founderData.image) {
        founderData.image = founders[index].image;
    }
    if (!founderData.gallery) {
        founderData.gallery = founders[index].gallery;
    }

    const updatedFounder = {
        ...founders[index],
        ...founderData,
        id: id // Ensure ID remains unchanged
    };

    founders[index] = updatedFounder;
    saveFounders(founders);
    return updatedFounder;
};

// Delete product
const deleteProduct = (id) => {
    const products = getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        throw new Error('Product not found');
    }

    products.splice(index, 1);
    saveProducts(products);
};

// Delete founder
const deleteFounder = (id) => {
    const founders = getAllFounders();
    const index = founders.findIndex(f => f.id === id);
    if (index === -1) {
        throw new Error('Founder not found');
    }

    founders.splice(index, 1);
    saveFounders(founders);
};

module.exports = {
    getProductById,
    getFounderById,
    getProductsByFounderId,
    getFounderByProductId,
    addProduct,
    addFounder,
    updateProduct,
    updateFounder,
    deleteProduct,
    deleteFounder
}; 