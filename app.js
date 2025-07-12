require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const passport = require('passport');
const mongoose = require("mongoose");
const nocache = require('nocache');
const http = require('http');

// MongoDB connection
mongoose.connect(process.env.MONGODB)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Passport configuration
require('./config/auth');
const { initializingPassport } = require("./config/passportConfig");
initializingPassport(passport);

// Routers
const usersRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(nocache());

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/', usersRouter);
app.use('/admin', adminRouter);

// Google Auth
app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/user/index')
);

// Catch 404 and forward to error handler
app.use((req, res, next) => next(require('http-errors')(404)));

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// Get port and create server
const port = process.env.PORT || 3000;
app.set('port', port);
const server = http.createServer(app);
server.listen(port,'0.0.0.0', () => console.log(`Server is listening on port ${port}`));

module.exports = app;
