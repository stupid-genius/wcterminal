const {APIClient} = require('APIClient');
const Logger = require('log-ng').default;
const {gaussian, PRNG} = require('PRNG/PRNG.js');

const client = new APIClient();
const logger = new Logger('commandRegistry.js');

const registry = Object.freeze({
	anagram: {
		func: async function(word){
			try{
				const response = await client.anagram({word});
				this.echo(response);
			}catch(e){
				const msg = JSON.stringify(e);
				logger.error(msg);
				this.echo(msg);
			}
		},
		usage: 'anagram [word]'
	},
	cas: {
		func: function(){
			this.startSubTerminal({
				name: 'cas',
				greeting: 'Algebrite Computer Algebra System',
				prompt: 'cas>',
				registry: function executor(input){
					if(input === 'exit'){
						this.echo('exiting');
						this.exitSubTerminal();
						return;
					}
					// eslint-disable-next-line no-undef
					this.echo(Algebrite.run(input));
				},
			});
		}
	},
	clear: {
		func: function(){
			this.clear();
		}
	},
	date: {
		/**
		 * @example date -m 1234567890
		 * @example date 1234567890 {year: 'numeric', month: 'long', day: 'numeric'}
		 */
		func: function dateFn(dateish, format){
			logger.debug(`Date called with ${dateish}`);
			const millis = dateFn.opts.m;
			let date;

			if(!isNaN(dateish)){
				logger.debug('Date is a number');
				date = new Date(Number(dateish));
			}else{
				logger.debug('Date is not a number');
				date = new Date(dateish);
			}

			if(isNaN(date.getTime())){
				logger.debug('Date is invalid');
				date = Date();
			}

			if(millis){
				date = date.getTime();
			}else if(format){
				date = date.toLocaleDateString('en-US', format);
			}

			this.echo(date);
		},
		opts: 'm',
		usage: 'date [-m] [date-like] [format]'
	},
	dm42: {
		func: function(){
			// maybe support USB connection to DM42
			this.echo('Start DM42 editor');
		}
	},
	endec: {
		func: function endec(schema, text){
			const decode = endec.opts.d;
			const echo = this.echo.bind(this);

			switch(schema){
			case 'base64':
				if(decode){
					logger.debug(`Decoding: ${text}`);
					echo(atob(text));
				}else{
					echo(btoa(text));
				}
				break;
			case 'binary':
				if(decode){
					echo(text.split(' ').map(function(c){
						return String.fromCharCode(parseInt(c, 2));
					}).join(''));
				}else{
					echo(text.split('').map(function(c){
						return c.charCodeAt(0).toString(2);
					}).join(' '));
				}
				break;
			case 'hex':
				if(decode){
					echo(text.split(' ').map(function(c){
						return String.fromCharCode(parseInt(c, 16));
					}).join(''));
				}else{
					echo(text.split('').map(function(c){
						return c.charCodeAt(0).toString(16);
					}).join(' '));
				}
				break;
			case 'rot13':
				if(decode){
					text = text.replace(/[a-zA-Z]/g, function(c){
						echo(String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() <= 'm' ? 13 : -13)));
					});
				}else{
					text = text.replace(/[a-zA-Z]/g, function(c){
						echo(String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() >= 'n' ? 13 : -13)));
					});
				}
				break;
			case 'url':
				if(decode){
					echo(decodeURI(text));
				}else{
					echo(encodeURI(text));
				}
				break;
			default:
				echo('Unknown schema');
				break;
			}
		},
		opts: 'd',
		usage: 'endec [-d] [base64|binary|hex|rot13|url] [text]'
	},
	exit: {
		func: function(){
			this.executor.exit?.();
		}
	},
	help: {
		func: function(command){
			logger.debug(`Help called on ${command}`);
			const cmds = Object.keys(registry).concat(registry.help.rpcList).sort();
			if(command === undefined){
				this.echo(`Available commands:\n${cmds.join('\n')}`);
			}else if(!cmds.includes(command)){
				this.echo(`No help available for ${command}`);
			}else{
				window.location.href = `https://letmegooglethat.com/?q=${command}`;
			}
		},
		usage: 'help [command]'
	},
	history: {
		func: function(){
			this.echo(this.commandHistory.join('<br />'));
		}
	},
	ip: {
		func: async function(ip){
			try{
				const response = await client.ipinfo({ip});
				this.echo(response);
			}catch(e){
				const msg = JSON.stringify(e);
				logger.error(msg);
				this.echo(msg);
			}
		},
		usage: 'ip [ip]'
	},
	js: {
		func: function(){
			this.startSubTerminal('js', function executor(input){
				if(input === 'exit'){
					this.echo('exiting');
					this.exitSubTerminal();
					return;
				}
				try{
					this.echo(eval(input));
				}catch(e){
					this.echo(e);
				}
			});
		}
	},
	// json: {
	// 	func: function(){
	// 		this.echo('JSON editor, formatter, validator');
	// 	}
	// },
	loglevel: {
		func: function(newLevel){
			if(newLevel){
				Logger.setLogLevel(newLevel);
			}
			this.echo(Logger.level);
		},
		usage: 'loglevel [level]'
	},
	lookup: {
		func: function lookup(code){
			const printTable = lookup.opts.t;

			if(printTable){
				switch(printTable){
				case 'unicode':
					this.echo('Unicode table');
					break;
				case 'ascii':{
					const containerWidth = 80;
					const maxEntryLength = 'ASCII 126 = ~'.length;
					const entriesPerRow = Math.floor(containerWidth / maxEntryLength);
					const rows = [];
					let currentRow = [];
					for(let i = 32; i < 127; i++){
						const entry = `ASCII ${i} = ${String.fromCharCode(i)}`;
						currentRow.push(entry);
						if(currentRow.length >= entriesPerRow){
							// Current row is full, start a new one
							rows.push(currentRow.join('\t'));
							currentRow = [];
						}
					}
					if(currentRow.length > 0) rows.push(currentRow.join('\t'));
					this.echo(rows.join('<br />'));
					break;
				}
				case 'html':
					this.echo('HTML entities');
					break;
				case 'emoji':
					this.echo('Emoji table');
					break;
				default:
					this.echo(`Unknown schema ${printTable}`);
					break;
				}
			}else if(code){
				const htmlEntityRegex = /^&([a-z0-9]+|#[0-9]+|#x[0-9a-f]+);$/i;

				let output;
				if(htmlEntityRegex.test(code)){
					const textarea = document.createElement('textarea');
					textarea.textContent = code;
					output = textarea.innerHTML;
				}else{
					output = String.fromCodePoint(code);
				}

				this.echo(output);
			}
		},
		opts: 't:',
		usage: 'lookup [-t schema]|[symbol]'
	},
	passgen: {
		func: async function(){
			try{
				const response = await client.passgen({});
				this.echo(response);
			}catch(e){
				const msg = JSON.stringify(e);
				logger.error(msg);
				this.echo(msg);
			}
		}
	},
	prng: {
		func: async function(generator){
			switch(generator){
			case 'nist':{
				try{
					const response = await client.nistprng({});
					this.echo(JSON.parse(response).pulse.localRandomValue);
				}catch(e){
					const msg = JSON.stringify(e);
					logger.error(msg);
					this.echo(msg);
				}
				break;
			}
			case 'integer':
				this.echo(PRNG.integer());
				break;
			case 'normal':
				this.echo(gaussian.random());
				break;
			default:
				this.echo('Unknown PRNG');
				break;
			}
		}
	},
	qotd: {
		func: async function(){
			try{
				const response = await client.qotd({});
				this.echo(response);
			}catch(e){
				const msg = JSON.stringify(e);
				logger.error(msg);
				this.echo(msg);
			}
		}
	},
	time: {
		func: function time(){
			if(time.opts.m){
				this.echo(Date.now());
			}else{
				// eslint-disable-next-line no-inner-declarations
				function padNumber(num){
					return num < 10 ? '0' + num : num;
				}
				const date = new Date();
				this.echo(`${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`);
			}
		},
		opts: 'm',
		usage: 'time [-m]'
	},
	weather: {
		func: async function(location){
			try{
				const response = await client.weather({location});
				this.echo(response);
			}catch(e){
				const msg = JSON.stringify(e);
				logger.error(msg);
				this.echo(msg);
			}
		},
		usage: 'weather [location]'
	}
});

module.exports = registry;
