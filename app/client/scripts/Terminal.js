const {APIClient} = require('APIClient');
const {
	JSONRPCClient,
	Executor
} = require('../../server/Executor.js');
const Logger = require('log-ng').default;
const commandRegistry = require('./commandRegistry');

const logger = new Logger('Terminal.js');

const MAX_HISTORY = 100;
const MAX_OUTPUT = 1000;

/**
 * @class Terminal
 * @extends HTMLElement
 * @description A web component that mimics a terminal
 * @example
 * <ng-terminal></ng-terminal>
 * @example
 * const term = document.createElement('ng-terminal');
 * document.body.appendChild(term);
 */
class Terminal extends HTMLElement{
	constructor(){
		super();
		this.attachShadow({mode: 'open'});

		this.parentTerminal = null;
		this.commandHistory = [];
		this.historyIndex = -1;

		const savedHistory = localStorage.getItem('commandHistory');
		if(savedHistory){
			this.commandHistory = JSON.parse(savedHistory);
			logger.debug(`Loading command history (${this.commandHistory.length} items)`);
			this.historyIndex = this.commandHistory.length;
		}

		this.inputHandler = this.inputHandler.bind(this);
		this.reset = this.reset.bind(this);
		this.addEventListener('terminal-reset', this.reset);
	}

	connectedCallback(){
		logger.debug('Terminal connected');
		document.addEventListener('DOMContentLoaded', async () => {
			logger.debug('DOMContentLoaded event fired');

			this.executor ??= (() => {
				logger.debug('Creating executor');
				const execLogger = new Logger('Executor.js');
				let rpcClient;
				if(this.rpcEnabled){
					logger.debug('RPC enabled');
					const rpcLogger = new Logger('Executor.js (JSONRPCClient)');
					rpcClient = JSONRPCClient(rpcLogger, new APIClient());
				}
				return Executor.bind(this)(execLogger, commandRegistry, rpcClient);
			})();

			this.reset(new CustomEvent('terminal-reset', {detail: {clear: true}}));
		});
	}

	disconnectedCallback(){
		logger.debug('Terminal disconnected');
		this.inputLine.removeEventListener('keydown', this.inputHandler);
		this.removeEventListener('click', this.focusHandler);
	}

	reset(event){
		logger.debug(`Terminal reset (${this.parentTerminal ? 'sub-terminal' : 'main terminal'})`);
		logger.debug(`Auth state: ${this.authState}, RPC enabled: ${this.rpcEnabled}`);

		// setting the authState will bypass logging in, but there will be no token
		if(this.rpcEnabled && this.authState !== Executor.OK){
			logger.debug('logging in');
			this.loginModal();
		}else{
			const clear = event.detail?.clear ?? false;
			logger.debug(`reset ${clear ? 'and clear ' : ''}terminal`);
			this.uiModal(clear);
		}

		this.focusHandler = function(){this.inputLine.focus();}.bind(this);
		this.addEventListener('click', this.focusHandler);
		this.focusHandler();
	}

	applyStyles(){
		const styles = this.querySelector('style').cloneNode(true);
		this.shadowRoot.appendChild(styles);
	}

	loginModal(){
		this.shadowRoot.innerHTML = '';
		this.applyStyles();

		const loginTemplate = this.querySelector('template#login').content.cloneNode(true);
		this.shadowRoot.appendChild(loginTemplate);
		this.inputLine = this.shadowRoot.querySelector('.input-line');
		this.output = this.shadowRoot.querySelector('.output');
		this.echo('Please log in');

		let username, password;
		const loginHandler = async (e) => {
			if(e.key === 'Enter'){
				e.preventDefault();
				const value = (this.inputLine.value ?? this.inputLine.textContent).trim();
				username === undefined ? username = value : password = value;

				if(username && password){
					try{
						this.authState = await this.executor.login(username, password);
						logger.debug(`Login state: ${this.authState}`);
						if(this.authState === Executor.NOTOKEN){
							this.loginModal();
							this.focusHandler();
							return;
						}

						this.inputLine.removeEventListener('keydown', loginHandler);
						this.removeEventListener('click', this.focusHandler);
						this.reset(new CustomEvent('terminal-reset', {detail: {clear: true}}));
					}catch(e){
						this.echo(e);
						logger.error(e);
					}
				}else{
					logger.debug(`awaiting password for ${username}`);

					const pwInput = document.createElement('input');
					pwInput.type = 'password';
					pwInput.classList.add('input-line');

					this.inputLine.textContent = this.inputLine.value = '';
					this.inputLine.removeEventListener('keydown', loginHandler);
					this.removeEventListener('click', this.focusHandler);
					this.inputLine.replaceWith(pwInput);
					this.inputLine = this.shadowRoot.querySelector('.input-line');

					this.prompt = 'password:';
					this.inputLine.addEventListener('keydown', loginHandler);
					this.addEventListener('click', this.focusHandler);
					this.focusHandler();
				}
			}
		};
		this.inputLine.addEventListener('keydown', loginHandler);
	}

	uiModal(clear){
		const output = this.shadowRoot.querySelector('.output')?.innerHTML;
		this.shadowRoot.innerHTML = '';
		this.applyStyles();

		const uiTemplate = this.querySelector('template#ui').content.cloneNode(true);
		this.shadowRoot.appendChild(uiTemplate);
		this.inputLine = this.shadowRoot.querySelector('.input-line');
		this.output = this.shadowRoot.querySelector('.output');

		if(clear && this.greeting){
			logger.debug('clearing terminal');
			this.echo(this.greeting);
		}else{
			this.output.innerHTML = output ?? '';
		}

		this.inputLine.addEventListener('keydown', this.inputHandler);
		this.inputLine.focus();
	}

	get greeting(){
		return this.getAttribute('greeting');
	}

	set greeting(value){
		if(value === undefined){
			this.removeAttribute('greeting');
		}else{
			this.setAttribute('greeting', value);
		}
	}

	get prompt(){
		const prompt = this.shadowRoot.querySelector('.prompt');
		return prompt.textContent;
	}

	set prompt(value){
		const prompt = this.shadowRoot.querySelector('.prompt');
		prompt.innerHTML = `${value}&nbsp;`;
	}

	get rpcEnabled(){
		return this.getAttribute('rpc') === 'true';
	}

	inputHandler(e){
		switch(e.key){
		case 'Enter':{
			e.preventDefault();
			const command = this.inputLine.textContent.trim();
			this.inputLine.textContent = '';
			this.echo(`${this.prompt}${command}`);
			this.processCommand(command);
			break;
		}
		case 'ArrowUp':
			logger.debug(`History index (back): ${this.historyIndex}`);
			if(this.historyIndex > 0){
				this.historyIndex -= 1;
				this.inputLine.textContent = this.commandHistory[this.historyIndex];
			}
			break;
		case 'ArrowDown':
			logger.debug(`History index (forward): ${this.historyIndex}`);
			if(this.historyIndex < this.commandHistory.length - 1){
				this.historyIndex += 1;
				this.inputLine.textContent = this.commandHistory[this.historyIndex];
			}else{
				this.historyIndex = this.commandHistory.length;
				this.inputLine.textContent = '';
			}
			break;
		}
	}

	async processCommand(command){
		try{
			const status = await this.executor(command);
			logger.debug(`Status: ${status}`);
			switch(status){
			case Executor.OK:
				logger.debug(`${command} executed successfully`);
				// if(command !== this.commandHistory[this.commandHistory.length - 1] && command !== 'login'){
				if(command !== this.commandHistory[this.commandHistory.length - 1]){
					this.commandHistory.push(command);
					if(this.commandHistory.length > MAX_HISTORY){
						this.commandHistory.shift();
					}
					localStorage.setItem('commandHistory', JSON.stringify(this.commandHistory));
					this.historyIndex = this.commandHistory.length;
				}
				break;
			case Executor.ENOTFOUND:
				logger.info(`${command} not found`);
				break;
			case Executor.ECMDERR:
				logger.error(`Error executing ${command}`);
				break;
			case Executor.EBADARGS:
				logger.warn(`${command} called with bad arguments`);
				break;
			default:
				logger.error(`Unknown status: ${status} for ${command}`);
				break;
			}
		}catch(e){
			logger.error(e);
			this.echo(e);
		}
	}

	clear(){
		this.output.innerHTML = '';
	}

	echo(text){
		if(text !== undefined && text !== null && text !== ''){
			this.output.innerHTML += `<div>${text}</div>`;
		}

		while(this.output.children.length > MAX_OUTPUT){
			this.output.removeChild(this.output.firstChild);
		}

		const rect = this.inputLine.getBoundingClientRect();
		if(rect.bottom > window.innerHeight){
			this.inputLine.scrollIntoView({ behavior: 'smooth' });
		}
	}

	startSubTerminal(config){
		logger.info(`Starting sub-terminal: ${config.name}`);

		this.removeEventListener('terminal-reset', this.reset);
		const subLogger = new Logger(`Executor.js (${config.name})`);
		const subterm = document.createElement('ng-terminal');
		subterm.innerHTML = this.innerHTML;
		subterm.greeting = config.greeting;
		subterm.executor = Executor.bind(subterm)(subLogger, config.registry);
		subterm.parentTerminal = this;
		this.replaceWith(subterm);
		subterm.dispatchEvent(new CustomEvent('terminal-reset', {detail: {clear: true}}));
		if(config.prompt !== undefined){
			subterm.prompt = config.prompt;
		}
		return subterm;
	}

	exitSubTerminal(){
		if(this.parentTerminal){
			logger.info('Exiting sub-terminal');
			logger.debug(`Parent terminal: ${JSON.stringify(this.parentTerminal)}`);
			this.parentTerminal.addEventListener('terminal-reset', this.parentTerminal.reset);
			this.replaceWith(this.parentTerminal);
			this.parentTerminal.dispatchEvent(new CustomEvent('terminal-reset', {detail: {clear: false}}));
		}else{
			logger.warn('No parent terminal found');
		}
	}
}

customElements.define('ng-terminal', Terminal);
