const express = require('express');
const Logger = require('log-ng');
const path = require('path');
const config = require('./config');
const JSONRPC = require('./JSONRPC');

const logger = new Logger(path.basename(__filename));
const router = express.Router();

router.get('/', (req, res) => {
	res.render('index', {
		text: 'Web Component Terminal server',
		title: config.appDescription
	});
});

router.post('/terminal', JSONRPC);

module.exports = router;
