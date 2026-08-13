// Tailwind CSS (build-time, replacing CDN runtime)
import './tailwind.css';

// CDN dependencies migrated to npm (must load before other modules)
import './deps.js';

// Temporary window bridge for Phase 1-2.
// Inline onclick handlers and existing Playwright specs depend on globals.
// This scaffolding is removed when inline handlers become delegated listeners.

import * as format from './core/format.js';
import * as validate from './auditor/validate.js';
import * as parse from './auditor/parse.js';
import * as buckets from './auditor/buckets.js';
import * as time from './auditor/time.js';
import * as geo from './optimizer/geo.js';
import * as download from './core/download.js';
import * as financials from './onboarding/financials.js';

Object.assign(window, format);
Object.assign(window, validate);
Object.assign(window, parse);
Object.assign(window, buckets);
Object.assign(window, time);
Object.assign(window, geo);
Object.assign(window, download);
Object.assign(window, financials);
