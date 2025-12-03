import { globalStyle } from "@vanilla-extract/css";
import { resetLayer } from "./layers.css";

/**
 * CSS Reset in the reset layer (lowest priority)
 * Based on modern CSS reset best practices
 */

// Box sizing
globalStyle("*, *::before, *::after", {
  "@layer": {
    [resetLayer]: {
      boxSizing: "border-box",
    },
  },
});

// Remove default margin
globalStyle("*", {
  "@layer": {
    [resetLayer]: {
      margin: 0,
    },
  },
});

// Prevent font size inflation
globalStyle("html", {
  "@layer": {
    [resetLayer]: {
      MozTextSizeAdjust: "none",
      WebkitTextSizeAdjust: "none",
      textSizeAdjust: "none",
    },
  },
});

// Remove list styles
globalStyle("ul, ol", {
  "@layer": {
    [resetLayer]: {
      listStyle: "none",
      padding: 0,
    },
  },
});

// Set core body defaults
globalStyle("body", {
  "@layer": {
    [resetLayer]: {
      minHeight: "100vh",
      lineHeight: 1.5,
    },
  },
});

// Set shorter line heights on headings and interactive elements
globalStyle("h1, h2, h3, h4, button, input, label", {
  "@layer": {
    [resetLayer]: {
      lineHeight: 1.1,
    },
  },
});

// Balance text wrapping on headings
globalStyle("h1, h2, h3, h4", {
  "@layer": {
    [resetLayer]: {
      textWrap: "balance",
    },
  },
});

// Links default styles
globalStyle("a", {
  "@layer": {
    [resetLayer]: {
      color: "inherit",
      textDecoration: "inherit",
    },
  },
});

// Make images easier to work with
globalStyle("img, picture, video, canvas, svg", {
  "@layer": {
    [resetLayer]: {
      display: "block",
      maxWidth: "100%",
    },
  },
});

// Inherit fonts for inputs and buttons
globalStyle("input, button, textarea, select", {
  "@layer": {
    [resetLayer]: {
      font: "inherit",
    },
  },
});

// Make sure textareas without a rows attribute are not tiny
globalStyle("textarea:not([rows])", {
  "@layer": {
    [resetLayer]: {
      minHeight: "10em",
    },
  },
});

// Anything that has been anchored to should have extra scroll margin
globalStyle(":target", {
  "@layer": {
    [resetLayer]: {
      scrollMarginBlock: "5ex",
    },
  },
});
