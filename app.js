'use strict';

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());





passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const ENTRYPOINT = process.env.ENTRYPOINT;
const ISSUER = process.env.ISSUER;
const CERT = process.env.CERT;

passport.use(new SamlStrategy({
    entryPoint: ENTRYPOINT,
    issuer: ISSUER,
    path: '/auth/saml/callback',
    protocol: 'https://',
    cert: CERT
  }, function (profile, done) {
    console.log('done profile', JSON.stringify(profile));

    return done(null, {
      email: profile.email,
    });
  })
);



const SECRET = process.env.SECRET || 'secretsecret';

app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000
  }
}));



app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('saml', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.post('/auth/saml/callback', passport.authenticate('saml', {
  successRedirect: '/',
  failureFlash: true
}), function(req, res) {
  console.log('/auth/saml/callback', JSON.stringify(req.body));

  res.redirect('/login')
});

app.all('*', function (req, res, next) {
  console.log(req.isAuthenticated());

  if (req.isAuthenticated() || req.path == '/login') {
    next()
  } else {
    res.redirect('/login')
  }
});





app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;

