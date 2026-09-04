const key = import.meta.env.VITE_CARTO_KEY;

if (!key) {
  console.error(
    '[ATLAS] VITE_CARTO_KEY is not set. ' +
    'Maps will show CARTO watermarks until you add ' +
    'VITE_CARTO_KEY=<your-key> to .env.local at the repository root.'
  );
}

const tileUrl = key
  ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=' + key
  : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export { tileUrl };
