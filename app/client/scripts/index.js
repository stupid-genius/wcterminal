const Logger = require('log-ng').default;
const endpointRegistry = require('./endpointRegistry');
require('algebrite');
require('APIClient').APIClient(endpointRegistry);
require('./Terminal');

Logger.setLogLevel('debug');
