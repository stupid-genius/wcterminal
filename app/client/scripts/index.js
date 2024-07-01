const Logger = require('log-ng').default;
const endpointRegistry = require('./endpointRegistry');
require('APIClient').APIClient(endpointRegistry);
require('./Terminal');

Logger.setLogLevel('debug');
