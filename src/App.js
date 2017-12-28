import React from 'react'
import Axios from 'axios'
import { routesForTrelloData, promiseEnhancedTrelloCards } from 'lokum/lib/trello'

const defaultBoardID = 'G1QmhGhL'

const headerHeight = '2rem'

const headerStyle = {
	position: 'fixed',
	zIndex: 1,
	top: 0,
	left: 0,
	right: 0,
	minHeight: headerHeight,
	backgroundColor: '#111'
}

const iframeSectionStyle = ({ nobar }) => ({
	position: 'absolute',
	top: nobar ? 0 : headerHeight,
	left: 0,
	right: 0,
	bottom: 0,
	backgroundColor: '#fafafa'
})

const iframeStyle = {
	display: 'block',
	width: '100%',
	height: '100%',
	border: 'none'
}

const errorStyle = {
	margin: 0,
	color: 'red'
}

const GitHubIcon = ({ width, height }) => (
	<svg viewBox="0 0 128 128" style={{ width, height }}>
		<path fill="white" fillRule="evenodd" clipRule="evenodd" d="M64 5.103c-33.347 0-60.388 27.035-60.388 60.388 0 26.682 17.303 49.317 41.297 57.303 3.017.56 4.125-1.31 4.125-2.905 0-1.44-.056-6.197-.082-11.243-16.8 3.653-20.345-7.125-20.345-7.125-2.747-6.98-6.705-8.836-6.705-8.836-5.48-3.748.413-3.67.413-3.67 6.063.425 9.257 6.223 9.257 6.223 5.386 9.23 14.127 6.562 17.573 5.02.542-3.903 2.107-6.568 3.834-8.076-13.413-1.525-27.514-6.704-27.514-29.843 0-6.593 2.36-11.98 6.223-16.21-.628-1.52-2.695-7.662.584-15.98 0 0 5.07-1.623 16.61 6.19C53.7 35 58.867 34.327 64 34.304c5.13.023 10.3.694 15.127 2.033 11.526-7.813 16.59-6.19 16.59-6.19 3.287 8.317 1.22 14.46.593 15.98 3.872 4.23 6.215 9.617 6.215 16.21 0 23.194-14.127 28.3-27.574 29.796 2.167 1.874 4.097 5.55 4.097 11.183 0 8.08-.07 14.583-.07 16.572 0 1.607 1.088 3.49 4.148 2.897 23.98-7.994 41.263-30.622 41.263-57.294C124.388 32.14 97.35 5.104 64 5.104z"></path><path d="M26.484 91.806c-.133.3-.605.39-1.035.185-.44-.196-.685-.605-.543-.906.13-.31.603-.395 1.04-.188.44.197.69.61.537.91zm-.743-.55M28.93 94.535c-.287.267-.85.143-1.232-.28-.396-.42-.47-.983-.177-1.254.298-.266.844-.14 1.24.28.394.426.472.984.17 1.255zm-.575-.618M31.312 98.012c-.37.258-.976.017-1.35-.52-.37-.538-.37-1.183.01-1.44.373-.258.97-.025 1.35.507.368.545.368 1.19-.01 1.452zm0 0M34.573 101.373c-.33.365-1.036.267-1.552-.23-.527-.487-.674-1.18-.343-1.544.336-.366 1.045-.264 1.564.23.527.486.686 1.18.333 1.543zm0 0M39.073 103.324c-.147.473-.825.688-1.51.486-.683-.207-1.13-.76-.99-1.238.14-.477.823-.7 1.512-.485.683.206 1.13.756.988 1.237zm0 0M44.016 103.685c.017.498-.563.91-1.28.92-.723.017-1.308-.387-1.315-.877 0-.503.568-.91 1.29-.924.717-.013 1.306.387 1.306.88zm0 0M48.614 102.903c.086.485-.413.984-1.126 1.117-.7.13-1.35-.172-1.44-.653-.086-.498.422-.997 1.122-1.126.714-.123 1.354.17 1.444.663zm0 0"></path>
	</svg>
)

function parseHash(hashInput) {
	// displayOptions are added as mock query variables
	const [ rest, optionsJoined = '' ] = hashInput.split('?')
	// boardID is first path component
	const [ boardID, ...pathComponents ] = rest.split('/')
	const path = '/' + (pathComponents.join('/') || '')
	
	const optionsArray = optionsJoined.split('&').filter(string => string.length > 0)
	const displayOptions = optionsArray.reduce((options, pair) => {
		const [ key, value = true ] = pair.split('=')
		options[key] = value
		return options
	}, {})

	return {
		boardID,
		path,
		displayOptions
	}
}

function renderPreviewHTMLToIFrame(html, iframe) {
	const { contentDocument } = iframe
	contentDocument.open()
	contentDocument.write(html)
	contentDocument.write(`
<script>
function hijackAClick(e) {
	const target = e.currentTarget;
	if (target && target.pathname && target.host === location.host && target.pathname[0] === '/' && target.pathname[1] !== '/') {
		parent.navigatePreviewToPath(target.pathname);
		event.preventDefault();
		event.stopPropagation();
	}
} 

var links = document.getElementsByTagName('a');
for (var i = 0; i < links.length; i++) {
	links[i].addEventListener('click', hijackAClick)
}
</script>
`)
	contentDocument.close()
}

function formatOptionsPair(key, value) {
	if (!value) {
		return
	}
	else if (value === true) {
		return key
	}
	else {
		`${key}=${value}`
	}
}

function navigatedTo({ boardID, path = '', displayOptions }) {
	const query = Object.keys(displayOptions).map(key => formatOptionsPair(key, displayOptions[key])).filter(Boolean).join('&')
	const hash = `#${ boardID }${ path }${ query.length > 0 ? '?' + query : '' }`
	window.location.hash = hash
}

function conformPath(path) {
	if (path === '/' || path[path.length - 1] === '/') {
		return path
	}
	else {
		return path + '/'
	}
}

export default class App extends React.Component {
	constructor(props) {
		super(props)

		this.state = {
			boardID: null,
			pendingLoad: true,
			initialPath: '/',
			displayOptions: {}
		}

		this.onChangeBoardID = this.onChangeBoardID.bind(this)
		this.onKeypressBoardID = this.onKeypressBoardID.bind(this)
		this.onCommitBoardID = this.onCommitBoardID.bind(this)
		this.onSetIFrame = this.onSetIFrame.bind(this)
	}

	componentWillMount() {
		if (window) {
			this.updateFromHash()
			this.onHashChange = this.updateFromHash.bind(this)
			window.addEventListener('hashchange', this.onHashChange)
		}
	}

	componentDidMount() {
		window.navigatePreviewToPath = this.navigatePreview.bind(this)
	}

	componentWillUnmount() {
		window.removeEventListener('hashchange', this.onHashChange)
		delete window.navigatePreviewToPath
	}

	updateFromHash() {
		const hashInput = window.location.hash.substring(1)
		const { boardID, path, displayOptions } = parseHash(hashInput)

		if (!this.checkBoardID(boardID, { path, displayOptions, load: true })) {
			// Default board
			this.checkBoardID(defaultBoardID, { displayOptions, load: true })
		}
	}

	loadBoard(boardID) {
		Axios.get(`https://trello.com/b/${ boardID }.json`)
		.then(response => {
			const routes = routesForTrelloData(response.data)
			this.setState({
				boardID,
				boardError: null,
				routes
			}, () => {
				this.navigatePreview()
			})
		})
		.catch(error => {
			this.setState({
				boardError: error
			})
		})
	}

	checkBoardID(input, { path = '', displayOptions, load = false } = {}) {
		input = input.trim()
		input = input.replace(/^https?:\/\/trello.com\/b\//, '')
		const boardID = input.split('/')[0]

		this.setState(prev => ({
			boardID,
			initialPath: path,
			displayOptions: displayOptions || prev.displayOptions
		}))

		if (boardID.length === 0) {
			return false
		}
		
		if (load) {
			this.loadBoard(input)
		}

		return true
	}

	onChangeBoardID({ target: { value } }) {
		this.checkBoardID(value, { load: false })
	}

	onKeypressBoardID({ target: { value }, keyCode, which }) {
		if ((keyCode || which) !== 13) {
			return
		}
		
		this.checkBoardID(value, { load: true })
	}

	onCommitBoardID({ target: { value } }) {
		this.checkBoardID(value, { load: true })
	}
	
	onSetIFrame(iframe) {
		this.iframe = iframe
		this.navigatePreview()
	}

	htmlForPath(pathToFind) {
		const { routes } = this.state
		if (!routes) {
			return
		}

		pathToFind = conformPath(pathToFind)

		const matchingRoute = routes.find(({ path }) => (
			conformPath(path) === pathToFind
		))
		if (!matchingRoute) {
			return
		}

		let output = ''
		matchingRoute.handler({}, (html) => {
			output = html
		})

		return output
	}

	navigatePreview(path = this.state.initialPath) {
		const { iframe, state: { boardID, displayOptions } } = this
		if (!iframe || !boardID) {
			return
		}

		const { contentDocument } = this.iframe

		const html = this.htmlForPath(path) || ''
		renderPreviewHTMLToIFrame(html, iframe)

		navigatedTo({
			boardID,
			path,
			displayOptions
		})
	}

	render() {
		const { boardID, displayOptions, boardError } = this.state
		const { nobar = false } = displayOptions

		return (
			<main>
				{ (!nobar) &&
					<header style={ headerStyle }>
						<label>
							{ 'Trello Board ID: ' }
							<input
								value={ boardID }
								placeholder='Paste URL'
								style={{
									width: '6.5em' }}
								onChange={ this.onChangeBoardID }
								onKeyPress={ this.onKeypressBoardID }
								onBlur={ this.onCommitBoardID }
							/>
						</label>
						{ boardError && <p style={ errorStyle }>Error loading: { boardError.message }</p> }
						<a href="https://github.com/RoyalIcing/lokum" style={{
							position: 'absolute',
							top: 3,
							right: '0.5rem',
							display: 'inline-block',
							marginLeft: '1rem',
							verticalAlign: 'middle'
						}}>
							<GitHubIcon width={ 24 } height={ 24 } />
						</a>
					</header>
				}
				<section style={ iframeSectionStyle({ nobar }) }>
					<iframe ref={ this.onSetIFrame } style={ iframeStyle } />
				</section>
			</main>
		)
	}
}