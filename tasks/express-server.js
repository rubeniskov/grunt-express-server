/*
 * grunt-express-server
 *
 * Licensed under the MIT license.
 */

'use strict';

var express     = require('express'),
    path        = require('path'),
    util        = require('util'),
    morgan      = require('morgan');

module.exports = function(grunt) {

    grunt.registerMultiTask('express', 'Start a connect web server.', function() {
        var done = this.async(),
            app = express(),
            options = this.options({
                protocol: 'http',
                port: 8000,
                hostname: '0.0.0.0',
                base: '.',
                directory: null,
                keepalive: false,
                debug: false,
                livereload: false,
                open: false,
                useAvailablePort: false,
                middleware: null
            });

        if (options.protocol !== 'http' && options.protocol !== 'https') {
            grunt.fatal('protocol option must be \'http\' or \'https\'');
        }

        options.hostname = options.hostname === '*' ? '' : options.hostname;

        options.port = options.port === '?' ? 0 : options.port;

        options.middleware = options.middleware && (
            (options.middleware.call && options.middleware.call(this, app, options)) ||
            (options.middleware.join && options.middleware.join([], options.middleware))) || [];

        if (grunt.option('debug') || options.debug === true) {
            morgan.format('grunt', ('[D] server :method :url :status ' +
                ':res[content-length] - :response-time ms').magenta);
            options.middleware.unshift(morgan('grunt'));
        }

        options.middleware.forEach(function(middleware) {
            app.use.apply(app, util.isArray(middleware) ? middleware : [middleware]);
        });
        require(options.protocol).createServer.apply(this, (options.protocol === 'https' ? [{
            key: options.key || grunt.file.read(path.join(__dirname, 'certs', 'server.key')).toString(),
            cert: options.cert || grunt.file.read(path.join(__dirname, 'certs', 'server.crt')).toString(),
            ca: options.ca || grunt.file.read(path.join(__dirname, 'certs', 'ca.crt')).toString(),
            passphrase: options.passphrase || 'grunt'
        }] : []).concat([app]))
            .listen(options.port, options.hostname)
            .on('listening', function() {
                !options.keepalive && done();
            })
            .on('error', function(err) {
                if (err.code === 'EADDRINUSE') {
                    grunt.fatal('Port ' + options.port + ' is already in use by another process.');
                } else {
                    grunt.fatal(err);
                }
            });

        options.keepalive && grunt.log.write('Waiting forever...\n');
    });
};
