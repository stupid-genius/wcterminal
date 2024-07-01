const APIClient = require('APIClient');
const crypto = require('crypto');
const Logger = require('log-ng');
const config = require('./config');
const endpointRegistry = require('./endpointRegistry.js');

const client = new APIClient(endpointRegistry);
const logger = new Logger('commandRegistry.js');

const registry = Object.freeze({
	login: {
		func: function(user, pass){
			logger.debug(`Attempting to log in user ${user}`);
			let token = false;
			if(user === 'admin' && crypto.createHash('sha256').update(pass).digest('hex') === config.passHash){
				token = config.passHash;
			}
			this.rpc(token);
		}
	},
	prompt: {
		func: function(){
			// client.openai({
			// 	prompt: ''
			// });
			this.rpc('OpenAI prompt');
		}
	},
	'system.describe': {
		func: function(){
			const procs = Object.keys(registry).filter(proc => proc !== 'system.describe');
			const response = {
				sdversion: '1.0',
				name: 'WC Terminal Server',
				address: config.appURL,
				id: 'urn:md5:35a16e694fd6a3c6967c24447cbf446d',
				procs
			};
			this.rpc(JSON.stringify(response));
		}
	}
});

module.exports = registry;
