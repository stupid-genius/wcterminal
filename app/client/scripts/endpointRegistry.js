const registry = Object.freeze({
	anagram: {
		url: 'https://stupid-genius.com/anagrams.cgi?{{word}}',
		method: 'get'
	},
	ipinfo: {
		url: 'https://ipinfo.io/{{ip}}',
		method: 'get',
		headers: {
			'accept': 'application/json'
		}
	},
	jsonrpc: {
		url: '/terminal',
		method: 'post',
		headers: {
			'content-type': 'application/json'
		},
		body: {
			id: '{{id}}',
			method: '{{method}}',
			params: '{{params}}'
		}
	},
	nistprng: {
		url: 'https://beacon.nist.gov/beacon/2.0/pulse/last',
		method: 'get'
	},
	passgen: {
		url: 'https://stupid-genius.com/passgen.cgi',
		method: 'get'
	},
	qotd: {
		url: 'https://stupid-genius.com/qotd.cgi',
		method: 'get'
	},
	weather: {
		url: 'https://wttr.in/{{location}}',
		method: 'get'
	}
});

module.exports = registry;
