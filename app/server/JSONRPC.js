const Logger = require('log-ng');
const commandRegistry = require('./commandRegistry.js');
const config = require('./config');
const { Executor } = require('./Executor.js');

const execLogger = new Logger('Executor.js (server)');
const logger = new Logger('JSONRPC.js');

const executor = Executor(execLogger, commandRegistry);

async function JSONRPC(req, res){
	logger.info('Parsing JSON-RPC request');
	logger.debug(JSON.stringify(req.body));
	res.rpc = (result, status=200) => {
		res.setHeader('content-type', 'application/json');
		res.status(status).send(JSON.stringify({
			id: req.body.id,
			jsonrpc: '2.0',
			result
		})).end();
	};

	const {method, params} = req.body;
	try{
		if(excludedMethods.includes(method) || (params[0] === config.passHash && (params.shift()))){
			logger.info(`Executing RPC method: ${method} with params: ${params}`);
			await executor.call(res, `${method} ${params?.join(' ') ?? ''}`);
		}else{
			throw new Error('Invalid token');
		}
	}catch(e){
		logger.error(e);
		res.rpc(e.message, 200);
	}
}

// these methods do not send the terminal token
const excludedMethods = ['help', 'login', 'system.describe'];

module.exports = JSONRPC;
