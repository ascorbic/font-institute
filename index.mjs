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
 *
 * @param {Object} reponse
 * @param {string} reponse.message
 * @param {string} reponse.recommendation
 * @param {string} reponse.sample
 * @param {string} reponse.error
 * @returns
 */
function displayResult({ message, recommendation, sample, error }) {
  if (error) {
    $("#response").style.display = "block";
    $("#reply").innerText = error;
    return;
  }
  $("#response").style.display = "block";
  $("#reply").innerText = message;

  /** @type {HTMLTextAreaElement} */
  // @ts-ignore
  const sampleField = $("#sample");
  if (!recommendation) {
    sampleField.style.display = "none";
    return;
  }

  /** @type {HTMLAnchorElement} */
  // @ts-ignore
  const fontName = $("#suggestion");
  fontName.innerText = recommendation;
  fontName.href = `https://fonts.google.com/specimen/${encodeURIComponent(
    recommendation
  )}`;
  sampleField.style.opacity = "0";
  sampleField.style.display = "block";
  sampleField.value = sample;

  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", recommendation);

  const styleUrl = url.toString();
  sampleField.style.fontFamily = recommendation;

  if (hasStylesheet(styleUrl)) {
    sampleField.style.opacity = "1";
    return;
  }

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = styleUrl;
  style.onload = () => {
    sampleField.style.opacity = "1";
  };

  style.onerror = () => {
    sampleField.style.fontFamily = "inherit";
    sampleField.style.opacity = "1";
    sampleField.value =
      "I'm sorry: there was an error loading the font. Maybe try asking again?";
  };
  document.head.appendChild(style);
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
