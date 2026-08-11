const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  const s = ms / 1000;
  if (s < 60) return s.toFixed(1) + 's';
  const m = Math.floor(s / 60);
  const rem = (s - m * 60).toFixed(1);
  return m + 'm ' + rem + 's';
}

function escapeCsvCell(val) {
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function relativeSpecFile(fullPath) {
  return path.relative(PROJECT_ROOT, fullPath).replace(/\\/g, '/');
}

function getDescribeChain(test) {
  const chain = [];
  let node = test.parent;
  while (node) {
    const t = node.title || '';
    if (t && !t.match(/[\w/-]+\.\w+$/) && t.length > 3) {
      chain.unshift(t);
    }
    node = node.parent;
  }
  return chain.join(' \u2014 ');
}

function detectFixture(test) {
  const sources = [
    test.fn ? test.fn.toString() : '',
    test.parent ? test.parent.title : '',
    test.parent && test.parent.parent ? test.parent.parent.title : '',
  ];
  const all = sources.join(' ');
  const match = all.match(/uploadAndAnalyze\(.*?['"]([^'"]+\.csv)['"]\)/);
  if (match) return match[1];
  const uploadMatch = all.match(/upload\(.*?['"]([^'"]+\.csv)['"]\)/);
  if (uploadMatch) return uploadMatch[1];
  return null;
}

function getModule(specFile) {
  const base = path.basename(specFile);
  if (base.startsWith('gap')) return 'Gap Analyzer';
  if (base.startsWith('opt')) return 'Optimizer';
  if (base.startsWith('onb')) return 'Onboarding';
  return 'Unknown';
}

function generateScenario(title, fixture) {
  const t = title.trim();
  const actionWords = ['clicking', 'selecting', 'hovering', 'toggling', 'changing',
    'uploading', 'opening', 'closing', 'typing', 'entering', 'pressing',
    'filtering', 'sorting', 'paginating', 'widening', 'resizing', 'dragging'];
  const assertionWords = ['shows', 'exists', 'is visible', 'has ', 'contains',
    'displays', 'matches', 'equals', 'returns', 'correct',
    'no longer', 'not ', 'balanced', 're-renders', 'updates'];

  const lower = t.toLowerCase();
  const isAction = actionWords.some(w => lower.startsWith(w));
  const isAssertion = assertionWords.some(w => lower.includes(w));

  const given = fixture
    ? 'Given I have uploaded ' + fixture
    : 'Given the analysis suite is loaded';
  const when = isAction
    ? 'When I ' + t
    : isAssertion
      ? 'When I run the analysis'
      : 'When I run the analysis';
  const then = 'Then ' + t;

  return given + ' \u00b7 ' + when + ' \u00b7 ' + then;
}

class CsvReporter {
  constructor(options) {
    this._options = options || {};
    this._results = [];
    this._startTime = null;
  }

  onBegin(config, suite) {
    this._startTime = Date.now();
  }

  onTestEnd(test, result) {
    const status = result.status === 'passed' ? 'passed'
      : result.status === 'failed' ? 'failed'
      : result.status === 'timedOut' ? 'timedOut'
      : result.status === 'skipped' ? 'skipped'
      : result.status;

    const comment = result.error ? result.error.message.split('\n')[0] : '';
    const specFile = test.location && test.location.file ? relativeSpecFile(test.location.file) : '';
    const describeBlock = getDescribeChain(test);
    const fixture = detectFixture(test);
    const scenario = generateScenario(test.title, fixture);

    this._results.push({
      name: test.title,
      status,
      duration: formatDuration(result.duration),
      comments: comment,
      specFile,
      describeBlock,
      fixture: fixture || '',
      scenario,
      module: getModule(specFile),
    });
  }

  onEnd(result) {
    const elapsed = Date.now() - this._startTime;
    const passed = this._results.filter(r => r.status === 'passed').length;
    const failed = this._results.filter(r => r.status === 'failed').length;
    const skipped = this._results.filter(r => r.status === 'skipped').length;
    const timedOut = this._results.filter(r => r.status === 'timedOut').length;

    const summaryStatus = failed > 0 ? 'FAILED' : timedOut > 0 ? 'TIMED_OUT' : 'PASSED';
    const summaryComment = this._results.length + ' tests, ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped, ' + timedOut + ' timed out';

    const headers = ['Test Name', 'Status', 'Duration', 'Comments', 'Spec File', 'Describe Block', 'Fixture', 'Scenario'];
    const lines = [headers.join(',')];
    for (const r of this._results) {
      lines.push([
        escapeCsvCell(r.name),
        r.status,
        r.duration,
        escapeCsvCell(r.comments),
        escapeCsvCell(r.specFile),
        escapeCsvCell(r.describeBlock),
        escapeCsvCell(r.fixture),
        escapeCsvCell(r.scenario),
      ].join(','));
    }
    lines.push([
      'OVERALL',
      summaryStatus,
      formatDuration(elapsed),
      escapeCsvCell(summaryComment),
      '',
      '',
      '',
      '',
    ].join(','));

    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filePath = path.join(REPORTS_DIR, 'test-report-' + ts + '.csv');
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');

    console.log('\nCSV report saved: ' + path.relative(process.cwd(), filePath));
    console.log('  ' + summaryComment + ' \u2014 ' + formatDuration(elapsed));
  }
}

module.exports = CsvReporter;
