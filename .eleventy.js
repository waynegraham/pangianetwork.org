// .eleventy.js
const path = require('path')
const { resolve } = require('path')

const { DateTime } = require('luxon')

const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItAttrs = require('markdown-it-attrs')
const implicitFigures = require('markdown-it-implicit-figures')
const slugify = require('slugify')
// const path = require("path");
// const sass = require("sass");

// @11ty plugins
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation') // https://www.11ty.dev/docs/plugins/navigation/
const { EleventyRenderPlugin } = require('@11ty/eleventy')
const Image = require('@11ty/eleventy-img') // https://www.11ty.dev/docs/plugins/image/
const EleventyVitePlugin = require('@11ty/eleventy-plugin-vite')
const eleventyPluginHubspot = require('eleventy-plugin-hubspot') // https://www.npmjs.com/package/eleventy-plugin-hubspot

const pluginImages = require('./eleventy.images.js')

// https://github.com/11ty/eleventy-img/issues/46#issuecomment-766054646
function generateImages(src, widths) {
	let source = path.join(__dirname, 'src', src)
	let options = {
		widths: widths,
		formats: ['webp', 'jpeg'],
		outputDir: '_site/assets/images/',
		urlPath: '/assets/images/',
		useCache: true,
		sharpJpegOptions: {
			quality: 99,
			progressive: true
		}
	}
	// genrate images, ! dont wait
	Image(source, options)
	// get metadata even the image are not fully generated
	return Image.statsSync(source, options)
}

function imageCssBackground(src, selector, widths) {
	const metadata = generateImages(src, widths)
	let markup = [
		`${selector} { background-image: url(${metadata.jpeg[0].url});} `
	]
	// i use always jpeg for backgrounds
	metadata.jpeg.slice(1).forEach((image, idx) => {
		markup.push(
			`@media (min-width: ${metadata.jpeg[idx].width}px) { ${selector} {background-image: url(${image.url});}}`
		)
	})
	return markup.join('')
}

module.exports = function (eleventyConfig) {
	eleventyConfig.addPassthroughCopy('src/assets')
	// eleventyConfig.addPassthroughCopy('CNAME')

	// Watch CSS files for changes
	// eleventyConfig.setBrowserSyncConfig({
	// 	files: './docs/assets/css/**/*.css'
	// })

	eleventyConfig.addPlugin(EleventyVitePlugin, {
		tempFolderName: '.11ty-vite', // Default name of the temp folder

		// base: 'creating-access.hbculibraries.org',

		root: path.resolve(__dirname, 'src'),

		// Options passed to the Eleventy Dev Server
		// e.g. domdiff, enabled, etc.

		// Added in Vite plugin v2.0.0
		serverOptions: {},

		// Defaults are shown:
		viteOptions: {
			// base: githubPath,
			clearScreen: false,
			appType: 'mpa', // New in v2.0.0
			assetsInclude: ['**/*.xml', '**/*.txt', 'CNAME'],
			// base: '/pangianetwork.org',

			// plugins: [pagefind()],

			server: {
				mode: 'development',
				middlewareMode: true
			},

			build: {
				mode: 'production'
			},

			// New in v2.0.0
			resolve: {
				alias: {
					// Allow references to `node_modules` folder directly
					'/node_modules': path.resolve('.', 'node_modules'),
					'~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap')
				}
			}
		}
	})

	eleventyConfig.addPlugin(pluginImages)

	// Customize Markdown library settings:

	/* Markdown Overrides */

	// markdown configurations
	const linkAfterHeader = markdownItAnchor.permalink.linkAfterHeader({
		class: 'anchor',
		symbol: '<span hidden>#</span>',
		style: 'aria-labelledby'
	})
	const markdownItAnchorOptions = {
		level: [1, 2, 3],
		slugify: (str) =>
			slugify(str, {
				lower: true,
				strict: true,
				remove: /["]/g
			}),
		tabIndex: false,
		permalink(slug, opts, state, idx) {
			state.tokens.splice(
				idx,
				0,
				Object.assign(new state.Token('div_open', 'div', 1), {
					// Add class "header-wrapper [h1 or h2 or h3]"
					attrs: [['class', `heading-wrapper ${state.tokens[idx].tag}`]],
					block: true
				})
			)

			state.tokens.splice(
				idx + 4,
				0,
				Object.assign(new state.Token('div_close', 'div', -1), {
					block: true
				})
			)

			linkAfterHeader(slug, opts, state, idx + 1)
		}
	}

	let markdownLibrary = markdownIt({
		html: true
	})
		.use(markdownItAnchor, markdownItAnchorOptions)
		.use(markdownItAttrs)

	// This is the part that tells 11ty to swap to our custom config
	eleventyConfig.setLibrary('md', markdownLibrary)

	eleventyConfig.amendLibrary('md', (mdLib) => {
		mdLib.use(markdownItAttrs)

		mdLib.use(implicitFigures, {
			figcaption: true, // <figcaption>alternative text</figcaption>, default: false
			lazyLoading: true,
			copyAttrs: false
		})

		mdLib.use(markdownItAnchor, {
			permalink: markdownItAnchor.permalink.ariaHidden({
				placement: 'after',
				class: 'header-anchor',
				assistiveText: (title) => `Permalink to "${title}`,
				// symbol:' §',
				symbol:
					'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">\r\n  <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>\r\n  <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>\r\n</svg>'
				// symbol: "\uF470", // need to load bootstrap icons in js
			}),
			level: [1, 2, 3, 4],
			slugify: eleventyConfig.getFilter('slugify')
		})
	})

	// filters

	eleventyConfig.addFilter('head', (array, n) => {
		if (!Array.isArray(array) || array.length === 0) {
			return []
		}
		if (n < 0) {
			return array.slice(n)
		}

		return array.slice(0, n)
	})

	eleventyConfig.addFilter('filterTagList', function filterTagList(tags) {
		return (tags || []).filter(
			(tag) => ['all', 'nav', 'post', 'posts'].indexOf(tag) === -1
		)
	})

	// RandomId function for IDs used by labelled-by
	// Thanks https://github.com/mozilla/nunjucks/issues/724#issuecomment-207581540
	// TODO: replace with addNunjucksGlobal? https://github.com/11ty/eleventy/issues/1498
	eleventyConfig.addFilter('generateRandomIdString', function (prefix) {
		return prefix + '-' + Math.floor(Math.random() * 1000000)
	})

	eleventyConfig.addFilter('readableDate', (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || 'utc' }).toFormat(
			format || 'dd LLLL yyyy'
		)
	})

	eleventyConfig.addFilter('dateToISO', (date) => {
		return DateTime.fromJSDate(date, { zone: 'utc' }).toISO({
			includeOffset: false,
			suppressMilliseconds: true
		})
	})

	eleventyConfig.addFilter('htmlDateString', (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd')
	})

	eleventyConfig.addFilter('postDate', (dateObj) => {
		return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED)
	})

	// plugins
	eleventyConfig.addPlugin(eleventyNavigationPlugin)

	// https://www.npmjs.com/package/eleventy-plugin-hubspot
	eleventyConfig.addPlugin(eleventyPluginHubspot, {
		portalId: 20251227
	})

	eleventyConfig.addFilter('markdownify', (str) => {
		return markdownItRenderer.render(str)
	})

	// shortcodes

	eleventyConfig.addNunjucksShortcode('cssBackground', imageCssBackground)

	eleventyConfig.addShortcode('excerpt', (article) => extractExcerpt(article))

	eleventyConfig.addShortcode('currentTime', () => {
		return DateTime.now().toString()
	})

	// https://www.11ty.dev/docs/plugins/image/
	// eleventyConfig.addShortcode('image', async function (src, alt, sizes) {
	// 	let metadata = await Image(src, {
	// 		widths: [200, 400, 600],
	// 		formats: ['avif', 'jpeg', null],
	// 		outputDir: path.join(eleventyConfig.dir.output, 'assets', 'images'),
	// 		urlPath: '/pangianetwork.org/assets/images/'
	// 	})

	// 	let imageAttributes = {
	// 		alt,
	// 		sizes,
	// 		class: 'img-fluid',
	// 		loading: 'lazy',
	// 		decoding: 'async'
	// 	}

	// 	// You bet we throw an error on a missing alt (alt="" works okay)
	// 	return Image.generateHTML(metadata, imageAttributes)
	// })

	return {
		dir: {
			input: 'src',
			output: '_site',
			layouts: '_layouts',
			data: '_data',
			includes: '_includes'
		},
		templateFormats: ['md', 'njk', 'html', 'liquid'],

		// Pre-process *.md files with: (default: `liquid`)
		markdownTemplateEngine: 'njk'

		// pathPrefix: 'pangianetwork.org' // omit this line if using custom domain
	}
}
