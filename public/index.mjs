// @ts-check

async function getSuggestions(message) {
  setLoading(true);
  try {
    const response = await fetch("/font", {
      method: "POST",
      body: JSON.stringify({ message }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await response.json();
    displayResult(result);
  } finally {
    setLoading(false);
  }
}

/**
 * @param {string} selector
 * @returns {HTMLElement}
 */
function $(selector) {
  // @ts-ignore
  return document.querySelector(selector);
}

function hasStylesheet(url) {
  return Array.from(document.styleSheets).some(
    (stylesheet) => stylesheet.href === url
  );
}

function setLoading(loading) {
  $("form").classList.toggle("loading", loading);
}

/**
 * Creates a sample field for a font recommendation
 * @param {string} family Font name
 * @param {string} sample Sample text
 * @returns {{section: HTMLElement, textarea: HTMLTextAreaElement}}
 */
function createSampleField(family, sample) {
  const section = document.createElement("section");
  section.className = "font-sample";

  const heading = document.createElement("h3");
  const link = document.createElement("a");
  link.href = `https://fonts.google.com/specimen/${family.replace(
    /\s+/g,
    "+"
  )}`;
  link.textContent = family;
  heading.appendChild(link);

  const textarea = document.createElement("textarea");
  textarea.spellcheck = false;
  textarea.value = sample;
  textarea.style.opacity = "0";
  textarea.style.display = "block";
  textarea.style.fontFamily = family;

  section.appendChild(heading);
  section.appendChild(textarea);

  return { section, textarea };
}

/**
 * Loads a Google Font and updates the textarea once loaded
 * @param {string} fontName
 * @param {HTMLTextAreaElement} textarea
 */
function loadFont(fontName, textarea) {
  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", fontName);
  const styleUrl = url.toString();

  if (hasStylesheet(styleUrl)) {
    textarea.style.opacity = "1";
    return;
  }

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = styleUrl;

  style.onload = () => {
    textarea.style.opacity = "1";
  };

  style.onerror = () => {
    textarea.style.fontFamily = "inherit";
    textarea.style.opacity = "1";
    textarea.value =
      "I'm sorry: there was an error loading the font. Maybe try asking again?";
  };

  document.head.appendChild(style);
}

/**
 * @typedef {Object} FontRecommendation
 * @property {string} family
 * @property {string} sample
 */

/**
 * @typedef {Object} Response
 * @property {string} message
 * @property {FontRecommendation[]} recommendations
 */

/**
 * @param {Response} response
 */
function displayResult({ message, recommendations }) {
  $("main").classList.add("loaded");
  $("#reply").innerText = message;

  // Clear previous results
  const responseContainer = $("#response");
  responseContainer.innerHTML = "";
  responseContainer.style.display = "block";

  // Handle recommendations
  recommendations.forEach(({ family, sample }) => {
    const { section, textarea } = createSampleField(family, sample);
    responseContainer.appendChild(section);
    loadFont(family, textarea);
  });
}

$("form").addEventListener("submit", (event) => {
  event.preventDefault();
  // @ts-ignore
  const message = event.target.elements.message.value;
  if (!message) {
    return;
  }

  getSuggestions(message);
});
