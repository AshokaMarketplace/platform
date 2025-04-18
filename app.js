const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const upload = require('./config/multer'); // Import upload from config/multer.js

const indexRouter = require('./routes/index');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const dataRoutes = require('./routes/data');
const apiRoutes = require('./routes/api');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/payment', paymentRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);
app.use('/data', dataRoutes);

// Error handler
app.use((req, res, next) => {
	const err = new Error('Not Found');
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	res.status(err.status || 500);
	res.render('error');
});

module.exports = { app };