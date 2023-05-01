// .eleventy.js
const { DateTime } = require("luxon");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");
const markdownItAttrs = require('markdown-it-attrs');
const slugify = require("slugify");

// @11ty plugins
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation"); // https://www.11ty.dev/docs/plugins/navigation/
const { EleventyRenderPlugin } = require("@11ty/eleventy");
const Image = require("@11ty/eleventy-img"); // https://www.11ty.dev/docs/plugins/image/

module.exports = function (eleventyConfig) {

    eleventyConfig.addPassthroughCopy('assets');

  // Watch CSS files for changes
  eleventyConfig.setBrowserSyncConfig({
    files: "./docs/assets/css/**/*.css",
  });

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

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

        pathPrefix: '', // omit this line if using custom domain
    };
};
