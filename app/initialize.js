const { createElement } = require('react')
const { render } = require('react-dom')
import App from './components/App.js'

document.addEventListener('DOMContentLoaded', function() {
	const el = document.getElementById('app')
	render(createElement(App, null), el)
})
