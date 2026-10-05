const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes/index');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
