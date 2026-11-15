const fs = require('fs');
const vm = require('vm');

const coreSrc = fs.readFileSync('js/core.js', 'utf8');
const productsSrc = fs.readFileSync('js/products.js', 'utf8');

const elements = {
  'products-grid': { id: 'products-grid', innerHTML: '' },
  'results-count': { id: 'results-count', innerHTML: '' },
  'shop-search': { id: 'shop-search', addEventListener: () => {} },
  'occasion-filter': { id: 'occasion-filter', addEventListener: () => {} },
  'sort-filter': { id: 'sort-filter', addEventListener: () => {} },
  'botanical-lookbook': {
    id: 'botanical-lookbook',
    querySelectorAll: (sel) => {
      if (sel === '.book-spread') return [
        { querySelector: () => ({ innerHTML: 'img' }) },
        { querySelector: () => ({ innerHTML: 'desc' }) }
      ];
      if (sel === '.book-dot') return [{}, {}];
      return [];
    },
    addEventListener: () => {}
  },
  'book-prev-btn': { id: 'book-prev-btn', addEventListener: () => {} },
  'book-next-btn': { id: 'book-next-btn', addEventListener: () => {} },
  'book-page-label': { id: 'book-page-label', textContent: '' },
  'book-flipping-leaf': { id: 'book-flipping-leaf', querySelector: () => ({ innerHTML: '' }), style: {} },
  'book-tempo-fill': { id: 'book-tempo-fill', style: {}, offsetWidth: 100 }
};

const sandbox = {
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  document: {
    readyState: 'complete',
    addEventListener: (ev, fn) => fn(),
    getElementById: (id) => elements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ style: {}, appendChild: () => {}, classList: { add: () => {} }, setAttribute: () => {}, children: [] }),
    body: { appendChild: () => {}, prepend: () => {} }
  },
  window: {
    addEventListener: () => {},
    location: { href: '' }
  },
  localStorage: {
    getItem: () => null,
    setItem: () => {}
  }
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

vm.createContext(sandbox);

vm.runInContext(coreSrc, sandbox);
vm.runInContext(productsSrc, sandbox);

console.log('FLORAL_CATALOG count:', sandbox.FLORAL_CATALOG.length);
console.log('Results count display:', elements['results-count'].innerHTML);
const cardMatches = (elements['products-grid'].innerHTML.match(/class="product-card"/g) || []).length;
console.log('Rendered product cards count:', cardMatches);
