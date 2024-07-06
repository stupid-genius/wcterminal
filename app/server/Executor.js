const getopt = require('./getopt');

/**
 * Executor — a command interpreter for string input.  Uses dependency injection because it is used in both client and server.
 * @param logger
 * @param registry - command registry; can be a function that overrides the default executor
 * @param [rpcClient] - JSON-RPC client; optional.  If not passed in the executor will not be able to execute RPC commands.
 * @returns {(function(*): Promise<{value}>)|*}
 */
function Executor(logger, registry, rpcClient){
	if(typeof registry === 'function'){
		return function(){
			return registry.apply(this, arguments) || Executor.OK;
		};
	}

	const env = this;
	if(env.echo === undefined){
		env.echo = logger.info;
	}

	const rpcList = [];

	const wordSplitPat = /"([^"]*)"|'([^']*)'|\S+/g;
	const executor = async function(input){
		logger.info(`Executing: ${input}`);
		const terms = input.match(wordSplitPat).map(term => term.replace(/^['"]|['"]$/g, ''));
		const cmd = terms.shift();
		const entry = registry[cmd];

		if(entry === undefined){
			if(rpcList.includes(cmd)){
				try{
					const result = JSON.stringify(await rpcClient(input));
					logger.debug(`RPC Response: ${result}`);
					env.echo(result);
					return Executor.OK;
				}catch(e){
					env.echo(e);
					return Executor.ECMDERR;
				}
			}
			env.echo(`${cmd}: no such command`);
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
					env.echo(`Usage: ${usage}`);
					return Executor.OK;
				case ':':
					env.echo(`${getopt.optopt}: option needs a value`);
					return Executor.EBADARGS;
				case '?':
					env.echo(`${getopt.optopt}: no such option`);
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
		return await func.apply(this, terms.slice(getopt.optind)) ?? Executor.OK;
	};

	if(rpcClient !== undefined){
		queueMicrotask(async function(){
			const result = await rpcClient('system.describe');
			logger.debug(`system.describe result: ${result}`);
			JSON.parse(result).procs.forEach((proc) => rpcList.push(proc));
			registry.help.rpcList = rpcList; // ugh, don't like tightly coupling to registry
			logger.debug(`RPC List: ${rpcList}`);

			Object.defineProperties(executor, {
				login: {
					value: async function(username, password){
						logger.info(`Attempting to log in user ${username}`);
						try{
							const token = await rpcClient(`login ${username} ${password}`);
							if(token === false){
								env.echo('Login failed');
								return Executor.NOTOKEN;
							}
							const originalClient = rpcClient;
							executor.exit ?? Object.defineProperty(executor, 'exit', {
								value: async function(){
									logger.info('Logging out');
									rpcClient = originalClient;
									env.authState = Executor.NOTOKEN;
									env.dispatchEvent(new CustomEvent('terminal-reset', {detail: {clear: true}}));
								}
							});
							rpcClient = new Proxy(rpcClient, {
								apply: function(target, thisArg, argumentsList){
									return target(argumentsList[0], token);
								}
							});
							return Executor.OK;
						}catch(e){
							logger.error(e);
							return e;
						}
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
	let id = 0;

	return function(input, token){
		try{
			logger.info(`Executing RPC: ${input}`);
			const terms = input.trim().split(/\s+/);
			const method = terms.shift();
			let params = terms;
			if(token){
				params = {
					token,
					params
				};
			}
			logger.debug(`Method: ${method}, params: ${params}`);

			try{
				return client.jsonrpc({id: id++, method, params}).then(response => {
					const parsed = JSON.parse(response);
					logger.debug(`Response: ${JSON.stringify(parsed)}`);
					if(parsed.error){
						throw new Error(parsed.error.message);
					}
					return parsed.result;
				});
			}catch(e){
				logger.error(e);
				return e;
			}
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
