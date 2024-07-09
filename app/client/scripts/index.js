require('algebrite');
const {APIClient} = require('APIClient');
const endpointRegistry = require('./endpointRegistry');
APIClient(endpointRegistry);
const Logger = require('log-ng').default;
const commandRegistry = require('./commandRegistry');
const { JSONRPCClient, Executor } = require('../../server/Executor.js');
require('./Terminal');

// Logger.setLogLevel('debug');
const logger = new Logger('index.js');

document.addEventListener('DOMContentLoaded', async () => {
	logger.debug('DOMContentLoaded event fired');
	customElements.whenDefined('ng-terminal').then(async () => {
		const terminal = document.querySelector('ng-terminal');
		logger.debug('Creating executor');
		const execLogger = new Logger('Executor.js');
		let rpcClient;
		if(terminal.rpcEnabled){
			logger.debug('RPC enabled');
			const rpcLogger = new Logger('Executor.js (JSONRPCClient)');
			rpcClient = JSONRPCClient(rpcLogger, new APIClient());
		}
		terminal.executor = Executor.bind(terminal)(execLogger, commandRegistry, rpcClient);
	});
});
