const getopt = require('./getopt');

/**
 * Executor — a command interpreter for string input.  Uses dependency injection because it is used in both client and server.
 * @param logger
 * @param registry
 * @param [rpcClient] - JSON-RPC client; optional.  If not passed in the executor will not be able to execute RPC commands.
 * @returns {(function(*): Promise<{value}>)|*}
 */
function Executor(logger, registry, rpcClient){
	if(this.echo === undefined){
		this.echo = logger.info;
	}
	const echo = this.echo.bind(this);

	let rpcList = [];

	const executor = async function(input){
		logger.info(`Executing: ${input}`);
		const terms = input.trim().split(/\s+/);
		const cmd = terms.shift();
		const entry = registry[cmd];

		if(entry === undefined){
			if(rpcList.includes(cmd)){
				try{
					const result = JSON.stringify(await rpcClient(input));
					logger.debug(`RPC Response: ${result}`);
					echo(result);
					return Executor.OK;
				}catch(e){
					echo(e);
					return Executor.ECMDERR;
				}
			}
			echo(`${cmd}: no such command`);
			return Executor.ENOTFOUND;
		}

		const {func, opts, usage} = entry;
		let ostr = opts;
		if(usage){
			ostr = ostr ? `${ostr}h` : 'h';
		}
		if(ostr !== undefined){
			logger.debug(`Parsing options: ${ostr} with ${terms}`);
			const switches = {};
			let opt;

			getopt.optreset = 1;
			getopt.optind = 0;
			while((opt = getopt(terms, ostr)) !== ''){
				logger.debug(`Opt: ${opt}, optarg: ${getopt.optarg}, optind: ${getopt.optind}`);
				switch(opt){
				case 'h':
					echo(`Usage: ${usage}`);
					return Executor.OK;
				case ':':
					echo(`${getopt.optopt}: option needs a value`);
					return Executor.EBADARGS;
				case '?':
					echo(`${getopt.optopt}: no such option`);
					return Executor.EBADARGS;
				default:
					logger.debug(`Switch: ${opt}, optarg: ${getopt.optarg}`);
					switches[opt] = getopt.optarg || true;
				}
			}
			func.opts = switches;
			logger.debug(`Switches: ${JSON.stringify(switches)}`);
		}else{
			getopt.optind = 0;
		}
		logger.debug(`Terms: ${terms}`);
		func.apply(this, terms.slice(getopt.optind));
		return Executor.OK;
	};

	if(rpcClient !== undefined){
		queueMicrotask(async function(){
			const result = await rpcClient('system.describe');
			logger.debug(`system.describe result: ${result}`);
			rpcList = JSON.parse(result).procs;
			logger.debug(`RPC List: ${rpcList}`);

			Object.defineProperty(executor, 'login', {
				value: async function(username, password){
					logger.info(`Attempting to log in user ${username}`);
					try{
						const auth = await rpcClient(`login ${username} ${password}`);
						if(auth === false){
							echo('Login failed');
							return Executor.NOTOKEN;
						}
						rpcClient = new Proxy(rpcClient, {
							apply: function (target, thisArg, argumentsList) {
								return target(argumentsList[0], auth);
							}
						});
						return Executor.OK;
					}catch(e){
						logger.error(e);
						return e;
					}
				}
			});
		});
	}

	return executor;
}
let signal = 0;
Object.defineProperties(Executor, {
	OK: {
		value: signal++
	},
	ENOTFOUND: {
		value: signal++
	},
	ECMDERR: {
		value: signal++
	},
	EBADARGS: {
		value: signal++
	},
	NOTOKEN: {
		value: signal++
	}
});

/**
 * JSONRPCClient
 * @param logger
 * @param client
 * @returns {function(*): *}
 * @constructor
 */
function JSONRPCClient(logger, client){
	return function(input, token){
		try{
			logger.info(`Executing RPC: ${input}`);
			const terms = input.trim().split(/\s+/);
			const method = terms.shift();
			if(token){
				terms.unshift(token);
			}
			const params = terms;
			logger.debug(`Method: ${method}, params: ${params}`);

			// TODO: errors don't throw; need to check and handle manually
			return client.jsonrpc({method, params}).then(response => {
				const parsed = JSON.parse(response);
				logger.debug(`Response: ${JSON.stringify(parsed)}`);
				return parsed.result;
			});
		}catch(e){
			logger.error(e);
			return e;
		}
	};
}

module.exports = {
	JSONRPCClient,
	Executor
};
