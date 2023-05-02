// .eleventy.js
const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require('markdown-it-attrs');
const slugify = require("slugify");
const path = require("path");
const sass = require("sass");

// @11ty plugins
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation"); // https://www.11ty.dev/docs/plugins/navigation/
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const Image = require("@11ty/eleventy-img"); // https://www.11ty.dev/docs/plugins/image/

const eleventyPluginHubspot = require('eleventy-plugin-hubspot'); // https://www.npmjs.com/package/eleventy-plugin-hubspot

// https://github.com/11ty/eleventy-img/issues/46#issuecomment-766054646
function generateImages(src, widths){
  let source = path.join(__dirname, "src" , src);
  let options = {
    widths: widths,
    formats: ["webp",'jpeg',],
    outputDir: "docs/assets/images/",
    urlPath: "/pangianetwork.org/assets/images/",
    useCache: true,
    sharpJpegOptions: {
      quality: 99,
      progressive: true
    }
  };
  // genrate images, ! dont wait
  Image(source, options);
  // get metadata even the image are not fully generated
  return Image.statsSync(source, options);
}

function imageCssBackground (src, selector, widths){
  const metadata = generateImages(src, widths);
  let markup = [`${selector} { background-image: url(${metadata.jpeg[0].url});} `];
  // i use always jpeg for backgrounds
  metadata.jpeg.slice(1).forEach((image, idx) => {
    markup.push(`@media (min-width: ${metadata.jpeg[idx].width}px) { ${selector} {background-image: url(${image.url});}}`);
  });
  return markup.join("");
}

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/assets");


  // Watch CSS files for changes
  eleventyConfig.setBrowserSyncConfig({
    files: "./docs/assets/css/**/*.css",
  });

  // filters

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  // plugins
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // https://www.npmjs.com/package/eleventy-plugin-hubspot
  eleventyConfig.addPlugin(eleventyPluginHubspot, {
      portalId: 20251227
  });

  // shortcodes

  eleventyConfig.addNunjucksShortcode("cssBackground", imageCssBackground);

  // https://www.11ty.dev/docs/plugins/image/
  eleventyConfig.addShortcode("image", async function(src, alt, sizes) {
		let metadata = await Image(src, {
			widths: [200, 400, 600],
			formats: ["avif", "jpeg", null],
      outputDir: path.join(eleventyConfig.dir.output, "assets", "images"),
      urlPath: "/pangianetwork.org/assets/images/"
		});

		let imageAttributes = {
			alt,
			sizes,
      class: "img-fluid",
			loading: "lazy",
			decoding: "async",
		};

		// You bet we throw an error on a missing alt (alt="" works okay)
		return Image.generateHTML(metadata, imageAttributes);
	});


  // markdown configurations
  const linkAfterHeader = markdownItAnchor.permalink.linkAfterHeader({
    class: "anchor",
    symbol: "<span hidden>#</span>",
    style: "aria-labelledby",
  });
  const markdownItAnchorOptions = {
    level: [1, 2, 3],
    slugify: (str) =>
      slugify(str, {
        lower: true,
        strict: true,
        remove: /["]/g,
      }),
    tabIndex: false,
    permalink(slug, opts, state, idx) {
      state.tokens.splice(
        idx,
        0,
        Object.assign(new state.Token("div_open", "div", 1), {
          // Add class "header-wrapper [h1 or h2 or h3]"
          attrs: [["class", `heading-wrapper ${state.tokens[idx].tag}`]],
          block: true,
        })
      );

      state.tokens.splice(
        idx + 4,
        0,
        Object.assign(new state.Token("div_close", "div", -1), {
          block: true,
        })
      );

      linkAfterHeader(slug, opts, state, idx + 1);
    },
  };

  /* Markdown Overrides */
  let markdownLibrary = markdownIt({
    html: true,
  }).use(markdownItAnchor, markdownItAnchorOptions).use(markdownItAttrs);

  // This is the part that tells 11ty to swap to our custom config
  eleventyConfig.setLibrary("md", markdownLibrary);

  return {
      dir: {
          input: 'src',
          output: './docs',
          layouts: '_layouts',
          data: '_data',
          includes: '_includes',
      },
      templateFormats: [
          'md',
          'njk',
          'html',
          'liquid'
      ],

      // Pre-process *.md files with: (default: `liquid`)
      markdownTemplateEngine: "njk",

      pathPrefix: 'pangianetwork.org', // omit this line if using custom domain
  };
};
