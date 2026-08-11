// Temporary window bridge for Phase 1-2.
// Inline onclick handlers and existing Playwright specs depend on globals.
// This scaffolding is removed in Phase 2 when inline handlers become delegated listeners.

import * as format from './core/format.js';
import * as validate from './auditor/validate.js';
import * as parse from './auditor/parse.js';
import * as buckets from './auditor/buckets.js';
import * as geo from './optimizer/geo.js';

Object.assign(window, format);
Object.assign(window, validate);
Object.assign(window, parse);
Object.assign(window, buckets);
Object.assign(window, geo);
