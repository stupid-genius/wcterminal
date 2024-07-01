const { APIClient } = require('APIClient');
const Logger = require('log-ng').default;

const client = new APIClient();
const logger = new Logger('commandRegistry.js');

const aiRegistry = Object.freeze({
	conversation: {
		func: function(){
			this.echo('Start a conversation with the AI');
		},
		usage: 'conversation'
	},
	exit: {
		func: function(){
			this.exitSubTerminal();
		},
		usage: 'exit'
	},
});

const registry = Object.freeze({
	ai: {
		func: function(){
			this.startSubTerminal('ai', aiRegistry);
		},
		usage: 'ai'
	},
	anagram: {
		func: function(word){
			this.echo(`Anagram of ${word}`);
		},
		usage: 'anagram [word]'
	},
	cas: {
		func: function(){
			this.echo('Use Algebrite CAS');
		},
		usage: 'cas'
	},
	cd: {
		func: function(dir){
			this.echo(`change directory to ${dir}`);
		},
		usage: 'cd [dir]'
	},
	cp: {
		func: function(src, dest){
			this.echo(`copy ${src} to ${dest}`);
		},
		usage: 'cp [src] [dest]'
	},
	clear: {
		func: function(){
			this.clear();
		},
		usage: 'clear'
	},
	exit: {
		func: function(){
			this.echo('logging out');
		},
		usage: 'exit'
	},
	help: {
		func: function(command){
			logger.debug(`Help called on ${command}`);
			const cmds = Object.keys(registry);
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
	loglevel: {
		func: function(newLevel){
			if(newLevel){
				Logger.setLogLevel(newLevel);
			}
			this.echo(Logger.level);
		},
		usage: 'loglevel [level]'
	},
	ls: {
		func: function(){
			this.echo('list files');
		},
		usage: 'ls [dir]'
	},
	mv: {
		func: function(src, dest){
			this.echo(`move ${src} to ${dest}`);
		},
		usage: 'mv [src] [dest]'
	},
	passgen: {
		func: function(){
			this.echo('generate a password');
		},
		usage: 'passgen'
	},
	pwd: {
		func: function(){
			this.echo('print working directory');
		}
	},
	qotd: {
		func: function(){
			this.echo('print quote of the day');
		}
	},
	vim: {
		func: function(){
			this.echo('start vim');
		},
		usage: 'vim [file]'
	}
});

module.exports = registry;
