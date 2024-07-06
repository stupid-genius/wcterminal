const APIClient = require('APIClient');
const crypto = require('crypto');
const Logger = require('log-ng');
const config = require('./config');
const endpointRegistry = require('./endpointRegistry.js');

const client = new APIClient(endpointRegistry);
const logger = new Logger('commandRegistry.js');

const hiddenCmds = ['exit', 'help', 'login', 'system.describe'];
const registry = Object.freeze({
	exit: {
		func: function(){
			// in a real server this should perform normal logout stuff, eg. cleaning up session, etc.
			this.rpc('exit');
		}
	},
	help: {
		func: function(command){
			this.rpc(`Return help for ${command}`);
		}
	},
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
			const procs = Object.keys(registry).filter(proc => !hiddenCmds.includes(proc));
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
