export function queryContains(baseSelector, text) {
  const elements = document.querySelectorAll(baseSelector);
  return Array.from(elements).filter((el) => el.textContent === text);
}

window.queryContains = queryContains;
