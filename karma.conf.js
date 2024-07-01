module.exports = function(config) {
	config.set({
		frameworks: ['mocha', 'chai'],
		customLaunchers: {
			FirefoxHeadless: {
				base: 'Firefox',
				flags: ['-headless']
			}
		},
		browsers: ['ChromeHeadless', 'FirefoxHeadless'],
		reporters: ['mocha'],
		// logLevel: config.LOG_DEBUG,
		colors: true,
		files: [
			'dist/client/**/*.js',
			'test/client/fixture.html',
			'test/client/**/*.js', // Client-side tests
		],
		singleRun:true
	});
};

