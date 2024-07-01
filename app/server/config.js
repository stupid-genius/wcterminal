const packageJson = require(process.env.npm_package_json);

module.exports = Object.freeze({
	appName: packageJson.name,
	appDescription: packageJson.description,
	appVersion: packageJson.version,
	appURL: process.env.APPURL || 'http://localhost:9000',
	logFile: process.env.LOGFILE || 'app.log',
	logLevel: process.env.LOGLEVEL || (process.env.NODE_ENV==='production'?'info':'debug'),
	nodeEnv: process.env.NODE_ENV || 'not set',
	passHash: '6388eda6646af1dd86ccfde9f1a22daf09ab5dee702e32a32b8be989fc4623db'
});

