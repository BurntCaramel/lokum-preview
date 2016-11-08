// See http://brunch.io for documentation.
module.exports = {
	files: {
		javascripts: {
			joinTo: {
				'vendor.js': /^(?!app)/,
				'app.js': /^app/
			}
		},
		stylesheets: {joinTo: 'app.css'},
		templates: {joinTo: 'app.js'}
	},
	plugins: {
		babel: { presets: [ 'es2015', 'react' ] },
		postcss: { processors: [ require('autoprefixer') ] },
		fingerprint: {
			autoReplaceAndHash: true
		}
	}
};
