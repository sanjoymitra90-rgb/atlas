// CDN dependencies migrated to npm
// These are exposed on window for backward compatibility with inline handlers

import Chart from 'chart.js/auto';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import html2pdf from 'html2pdf.js';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

window.Chart = Chart;
window.L = L;
window.html2pdf = html2pdf;
window.gantt = gantt;
