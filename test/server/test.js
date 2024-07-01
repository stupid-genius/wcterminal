const Logger = require('log-ng');
const path = require('path');
const config = require('../../app/server/config');

Logger(config);
const logger = new Logger(path.basename(__filename));

describe('RouteHelper Unit Tests', function(){
	logger.info('Please write some tests; I\'m lonely');
	it('Should have tests');
});
