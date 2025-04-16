const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { addProduct, addFounder, getFounderById, getProductById, updateProduct, updateFounder, deleteProduct, deleteFounder } = require('../utils/dataUtils');
const { getAllFounders, getAllProducts, saveProducts, saveFounders } = require('../utils/dataManager');
const data = require('../data');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'gallery') {
            cb(null, 'public/images/founders/gallery');
        } else if (file.fieldname === 'upiQrCode') {
            cb(null, 'public/images/founders/upi');
        } else {
            cb(null, 'public/images/founders');
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Admin dashboard
router.get('/', (req, res) => {
    const founders = getAllFounders();
    const products = getAllProducts();
    res.render('admin/index', { founders, products });
});

// Sellers management
router.get('/sellers', (req, res) => {
    try {
        const vendors = require('../data/vendors.json').vendors || [];
        res.render('admin/sellers', { vendors });
    } catch (error) {
        // If file doesn't exist or is invalid, use empty array
        res.render('admin/sellers', { vendors: [] });
    }
});

// Edit product page
router.get('/products/:id/edit', (req, res) => {
    try {
        const product = getProductById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        // Ensure product has all required fields with default values
        const productData = {
            ...product,
            features: product.features || [],
            materials: product.materials || [],
            dimensions: product.dimensions || '',
            careInstructions: product.careInstructions || '',
            rating: product.rating || 0,
            reviews: product.reviews || 0,
            inStock: product.inStock !== undefined ? product.inStock : true
        };
        res.render('admin/edit-product', { product: productData });
    } catch (error) {
        console.error('Error in edit product route:', error);
        res.status(500).send('Error loading product');
    }
});

// Edit founder page
router.get('/founders/:id/edit', (req, res) => {
    const founder = getFounderById(req.params.id);
    if (!founder) {
        return res.status(404).render('error', {
            message: 'Founder not found',
            error: { status: 404 }
        });
    }
    res.render('admin/edit-founder', { founder });
});

// Update product
router.put('/products/:id', upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 5 }
]), (req, res) => {
    try {
        const productData = {
            name: req.body.name,
            category: req.body.category,
            price: parseInt(req.body.price),
            description: req.body.description,
            founderId: req.body.founderId,
            features: req.body.features.split('\n').filter(f => f.trim()),
            materials: req.body.materials.split(',').map(m => m.trim()),
            dimensions: req.body.dimensions
        };

        // Handle new images
        if (req.files) {
            if (req.files.mainImage) {
                productData.images = ['/images/products/' + req.files.mainImage[0].filename];
            }
            if (req.files.additionalImages) {
                productData.images = productData.images || [];
                productData.images.push(...req.files.additionalImages.map(file => '/images/products/' + file.filename));
            }
        }

        const updatedProduct = updateProduct(req.params.id, productData);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Error updating product');
    }
});

// Update founder
router.put('/founders/:id', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
]), (req, res) => {
    try {
        const founderData = {
            name: req.body.name,
            title: req.body.title,
            bio: req.body.bio,
            story: req.body.story,
            location: req.body.location,
            socialLinks: {
                instagram: req.body.instagram,
                linkedin: req.body.linkedin,
                website: req.body.website
            },
            achievements: req.body.achievements.split('\n').filter(a => a.trim())
        };

        // Handle new images
        if (req.files) {
            if (req.files.image) {
                founderData.image = '/images/founders/' + req.files.image[0].filename;
            }
            if (req.files.gallery) {
                founderData.gallery = req.files.gallery.map(file => ({
                    url: '/images/founders/' + file.filename,
                    caption: ''
                }));
            }
        }

        const updatedFounder = updateFounder(req.params.id, founderData);
        res.json(updatedFounder);
    } catch (error) {
        console.error('Error updating founder:', error);
        res.status(500).send('Error updating founder');
    }
});

// Delete product
router.delete('/products/:id', (req, res) => {
    try {
        deleteProduct(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Error deleting product');
    }
});

// Delete founder
router.delete('/founders/:id', (req, res) => {
    try {
        deleteFounder(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting founder:', error);
        res.status(500).send('Error deleting founder');
    }
});

// Delete product image
router.delete('/products/:id/images', (req, res) => {
    try {
        const { imageUrl } = req.body;
        const product = getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Remove image from product's images array
        product.images = product.images.filter(img => img !== imageUrl);

        // Delete the image file
        const imagePath = path.join(__dirname, '../public', imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product image:', error);
        res.status(500).send('Error deleting product image');
    }
});

// Delete founder image
router.delete('/founders/:id/image', (req, res) => {
    try {
        const founder = getFounderById(req.params.id);
        if (!founder) {
            return res.status(404).json({ error: 'Founder not found' });
        }

        // Delete the image file
        if (founder.image) {
            const imagePath = path.join(__dirname, '../public', founder.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
            founder.image = null;
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting founder image:', error);
        res.status(500).send('Error deleting founder image');
    }
});

// Delete founder gallery image
router.delete('/founders/:id/gallery', (req, res) => {
    try {
        const { imageUrl } = req.body;
        const founder = getFounderById(req.params.id);
        if (!founder) {
            return res.status(404).json({ error: 'Founder not found' });
        }

        // Remove image from founder's gallery
        founder.gallery = founder.gallery.filter(img => img.url !== imageUrl);

        // Delete the image file
        const imagePath = path.join(__dirname, '../public', imageUrl);
        if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting founder gallery image:', error);
        res.status(500).send('Error deleting founder gallery image');
    }
});

// Add new founder
router.post('/founders', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'gallery', maxCount: 10 },
    { name: 'upiQrCode', maxCount: 1 }
]), async (req, res) => {
    try {
        const founderData = {
            id: 'founder' + (data.founders.length + 1),
            name: req.body.name,
            title: req.body.title,
            bio: req.body.bio,
            social: {
                instagram: req.body.instagram,
                linkedin: req.body.linkedin,
                twitter: req.body.twitter
            },
            gallery: []
        };

        // Handle main image
        if (req.files && req.files.image) {
            founderData.image = '/images/founders/' + req.files.image[0].filename;
        }

        // Handle gallery images
        if (req.files && req.files.gallery) {
            founderData.gallery = req.files.gallery.map(file => ({
                image: '/images/founders/gallery/' + file.filename,
                caption: ''
            }));
        }

        // Handle UPI QR code
        if (req.files && req.files.upiQrCode) {
            founderData.upiQrCode = '/images/founders/upi/' + req.files.upiQrCode[0].filename;
            founderData.upiId = req.body.upiId;
        }

        data.founders.push(founderData);
        await writeData(data);
        res.redirect('/admin');
    } catch (error) {
        console.error('Error adding founder:', error);
        res.status(500).send('Error adding founder');
    }
});

module.exports = router; 