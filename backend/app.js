var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var uploadRouter = require('./routes/upload');
var thresholdRouter = require('./routes/threshold');
var feedbackRouter = require('./routes/feedback');
var featuresRouter = require('./routes/features');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/api', uploadRouter);
app.use('/api', thresholdRouter);
app.use('/api', feedbackRouter);
app.use('/api', featuresRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'fraud-detection-api',
  });
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  
  if (req.path.startsWith('/api')) {
    res.json({
      success: false,
      error: err.message,
      status: err.status || 500,
    });
  } else {
    res.render('error');
  }
});

module.exports = app;
