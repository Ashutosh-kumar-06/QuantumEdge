/**
 * QuantumEdge – Comprehensive API Gateway Unit Tests
 * ===================================================
 * Pure Node.js (assert + fs) – no Docker, MongoDB, or RabbitMQ required.
 *
 * Sections:
 *   1. Schema Validation Tests        (Course.js & User.js)
 *   2. Seed Data Integrity Tests      (seed.js – DAG, field presence, counts)
 *   3. API Route Structure Tests      (index.js – endpoints, middleware, imports)
 *   4. Docker Compose Infrastructure  (docker-compose.yml)
 */

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

// ──────────────────────────── helpers ────────────────────────────

const ROOT      = path.resolve(__dirname, '..');
const MODELS    = path.join(ROOT, 'api-gateway', 'models');
const GATEWAY   = path.join(ROOT, 'api-gateway');
const COMPOSE   = path.join(ROOT, 'docker-compose.yml');

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

let passed  = 0;
let failed  = 0;
let skipped = 0;
const failures = [];

function test(section, name, fn) {
  const label = `[${section}] ${name}`;
  try {
    fn();
    passed++;
    console.log(`  ✅ PASS: ${label}`);
  } catch (err) {
    failed++;
    failures.push({ label, message: err.message });
    console.log(`  ❌ FAIL: ${label}`);
    console.log(`          ${err.message}`);
  }
}

// ──────────────────────────── 1. Schema Validation Tests ─────────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  1. SCHEMA VALIDATION TESTS                              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const courseSrc = readFile(path.join(MODELS, 'Course.js'));
const userSrc   = readFile(path.join(MODELS, 'User.js'));

// ---- Course Schema (CourseSchema) ----

test('Schema', 'Course.js file exists and is non-empty', () => {
  assert.ok(courseSrc.length > 0, 'Course.js should not be empty');
});

test('Schema', 'CourseSchema defines "courseId" field', () => {
  assert.ok(/courseId\s*:\s*\{/.test(courseSrc), 'courseId field missing');
});

test('Schema', 'CourseSchema defines "title" field', () => {
  // Match title inside CourseSchema (after "CourseSchema")
  const courseBlock = courseSrc.slice(courseSrc.indexOf('CourseSchema'));
  assert.ok(/title\s*:\s*\{/.test(courseBlock), 'title field missing in CourseSchema');
});

test('Schema', 'CourseSchema defines "modules" as an array (embedded sub-docs)', () => {
  assert.ok(/modules\s*:\s*\[/.test(courseSrc), 'modules array missing');
});

// ---- Module Sub-Schema (ModuleSchema) ----

test('Schema', 'ModuleSchema defines "id" field', () => {
  const moduleBlock = courseSrc.slice(
    courseSrc.indexOf('ModuleSchema'),
    courseSrc.indexOf('CourseSchema')
  );
  assert.ok(/id\s*:\s*\{/.test(moduleBlock), 'id field missing in ModuleSchema');
});

test('Schema', 'ModuleSchema defines "title" field', () => {
  const moduleBlock = courseSrc.slice(
    courseSrc.indexOf('ModuleSchema'),
    courseSrc.indexOf('CourseSchema')
  );
  assert.ok(/title\s*:\s*\{/.test(moduleBlock), 'title field missing in ModuleSchema');
});

test('Schema', 'ModuleSchema defines "description" field', () => {
  assert.ok(/description\s*:\s*\{/.test(courseSrc), 'description field missing');
});

test('Schema', 'ModuleSchema defines "prerequisites" as an array', () => {
  assert.ok(/prerequisites\s*:\s*\[/.test(courseSrc), 'prerequisites array missing');
});

test('Schema', 'ModuleSchema defines "estHours" field', () => {
  assert.ok(/estHours\s*:\s*\{/.test(courseSrc), 'estHours field missing');
});

test('Schema', 'ModuleSchema defines "starterCode" field', () => {
  assert.ok(/starterCode\s*:\s*\{/.test(courseSrc), 'starterCode field missing');
});

test('Schema', 'courseId is required', () => {
  const m = courseSrc.match(/courseId\s*:\s*\{[^}]+\}/);
  assert.ok(m && /required\s*:\s*true/.test(m[0]), 'courseId should be required');
});

test('Schema', 'Course title is required', () => {
  const courseBlock = courseSrc.slice(courseSrc.indexOf('CourseSchema'));
  const m = courseBlock.match(/title\s*:\s*\{[^}]+\}/);
  assert.ok(m && /required\s*:\s*true/.test(m[0]), 'Course title should be required');
});

test('Schema', 'Module id is required', () => {
  const moduleBlock = courseSrc.slice(0, courseSrc.indexOf('CourseSchema'));
  const m = moduleBlock.match(/id\s*:\s*\{[^}]+\}/);
  assert.ok(m && /required\s*:\s*true/.test(m[0]), 'Module id should be required');
});

test('Schema', 'Module title is required', () => {
  const moduleBlock = courseSrc.slice(0, courseSrc.indexOf('CourseSchema'));
  const m = moduleBlock.match(/title\s*:\s*\{[^}]+\}/);
  assert.ok(m && /required\s*:\s*true/.test(m[0]), 'Module title should be required');
});

test('Schema', 'Course model is exported as "Course"', () => {
  assert.ok(/mongoose\.model\(\s*['"]Course['"]/.test(courseSrc),
    'Model should be exported as Course');
});

// ---- User Schema ----

test('Schema', 'User.js file exists and is non-empty', () => {
  assert.ok(userSrc.length > 0, 'User.js should not be empty');
});

test('Schema', 'UserSchema defines "username" field', () => {
  assert.ok(/username\s*:\s*\{/.test(userSrc), 'username field missing');
});

test('Schema', 'username is required', () => {
  const m = userSrc.match(/username\s*:\s*\{[^}]+\}/);
  assert.ok(m && /required\s*:\s*true/.test(m[0]), 'username should be required');
});

test('Schema', 'username is unique', () => {
  const m = userSrc.match(/username\s*:\s*\{[^}]+\}/);
  assert.ok(m && /unique\s*:\s*true/.test(m[0]), 'username should be unique');
});

test('Schema', 'UserSchema defines "progress" as an array', () => {
  assert.ok(/progress\s*:\s*\[/.test(userSrc), 'progress array missing');
});

test('Schema', 'progress sub-doc has "moduleId"', () => {
  assert.ok(/moduleId\s*:\s*\{/.test(userSrc), 'moduleId missing in progress');
});

test('Schema', 'progress sub-doc has "completed" (Boolean)', () => {
  assert.ok(/completed\s*:\s*\{/.test(userSrc), 'completed missing in progress');
  assert.ok(/Boolean/.test(userSrc), 'completed should be Boolean');
});

test('Schema', 'progress sub-doc has "score" (Number)', () => {
  assert.ok(/score\s*:\s*\{/.test(userSrc), 'score missing in progress');
  const block = userSrc.slice(userSrc.indexOf('score'));
  assert.ok(/Number/.test(block), 'score should be Number');
});

test('Schema', 'User model is exported as "User"', () => {
  assert.ok(/mongoose\.model\(\s*['"]User['"]/.test(userSrc),
    'Model should be exported as User');
});

// ──────────────────────────── 2. Seed Data Integrity Tests ──────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  2. SEED DATA INTEGRITY TESTS                            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const seedSrc = readFile(path.join(GATEWAY, 'seed.js'));

// Extract the curriculum array using Node's vm module for safe JS evaluation
function extractCurriculum(src) {
  const vm = require('vm');
  const startToken = 'const curriculum = [';
  const startIdx   = src.indexOf(startToken);
  if (startIdx === -1) throw new Error('curriculum array not found');
  let depth = 0;
  let i     = startIdx + startToken.length - 1; // position of '['
  for (; i < src.length; i++) {
    if (src[i] === '[') depth++;
    if (src[i] === ']') depth--;
    if (depth === 0) break;
  }
  const arrayLiteral = src.slice(startIdx + startToken.length - 1, i + 1);
  // Safely evaluate the pure JS array literal in a sandboxed context
  const sandbox = {};
  const result = vm.runInNewContext(arrayLiteral, sandbox);
  // JSON round-trip to bring objects into the current realm (vm creates
  // objects with a different prototype chain which breaks deepStrictEqual)
  return JSON.parse(JSON.stringify(result));
}

let curriculum;

test('Seed', 'curriculum array can be parsed from seed.js', () => {
  curriculum = extractCurriculum(seedSrc);
  assert.ok(Array.isArray(curriculum), 'curriculum should be an array');
});

test('Seed', 'There are exactly 7 modules', () => {
  assert.strictEqual(curriculum.length, 7, `Expected 7 modules, got ${curriculum.length}`);
});

const REQUIRED_MODULE_FIELDS = ['id', 'title', 'description', 'prerequisites', 'estHours', 'starterCode'];

test('Seed', 'Every module has all required fields', () => {
  for (const mod of curriculum) {
    for (const field of REQUIRED_MODULE_FIELDS) {
      assert.ok(
        field in mod,
        `Module "${mod.id || 'unknown'}" missing field "${field}"`
      );
    }
  }
});

test('Seed', 'Every module id is a non-empty string', () => {
  for (const mod of curriculum) {
    assert.ok(typeof mod.id === 'string' && mod.id.length > 0,
      `Module id should be non-empty string, got: ${mod.id}`);
  }
});

test('Seed', 'All module ids are unique', () => {
  const ids = curriculum.map(m => m.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'Duplicate module ids found');
});

test('Seed', 'Every module title is a non-empty string', () => {
  for (const mod of curriculum) {
    assert.ok(typeof mod.title === 'string' && mod.title.length > 0,
      `Module "${mod.id}" has invalid title`);
  }
});

test('Seed', 'Every module description is a non-empty string', () => {
  for (const mod of curriculum) {
    assert.ok(typeof mod.description === 'string' && mod.description.length > 0,
      `Module "${mod.id}" has empty/invalid description`);
  }
});

test('Seed', 'Every module estHours is a positive number', () => {
  for (const mod of curriculum) {
    assert.ok(typeof mod.estHours === 'number' && mod.estHours > 0,
      `Module "${mod.id}" has invalid estHours: ${mod.estHours}`);
  }
});

test('Seed', 'Every module starterCode is a non-empty string', () => {
  for (const mod of curriculum) {
    assert.ok(typeof mod.starterCode === 'string' && mod.starterCode.length > 0,
      `Module "${mod.id}" has empty/invalid starterCode`);
  }
});

test('Seed', 'prerequisites is always an array', () => {
  for (const mod of curriculum) {
    assert.ok(Array.isArray(mod.prerequisites),
      `Module "${mod.id}" prerequisites should be an array`);
  }
});

test('Seed', 'All prerequisite references point to valid module ids', () => {
  const ids = new Set(curriculum.map(m => m.id));
  for (const mod of curriculum) {
    for (const prereq of mod.prerequisites) {
      assert.ok(ids.has(prereq),
        `Module "${mod.id}" references unknown prerequisite "${prereq}"`);
    }
  }
});

// DAG validation – detect cycles via topological sort (Kahn's algorithm)
test('Seed', 'Prerequisites form a valid DAG (no circular dependencies)', () => {
  const ids     = curriculum.map(m => m.id);
  const inDeg   = {};
  const adj     = {};
  for (const id of ids) { inDeg[id] = 0; adj[id] = []; }
  for (const mod of curriculum) {
    for (const prereq of mod.prerequisites) {
      adj[prereq].push(mod.id);
      inDeg[mod.id]++;
    }
  }
  const queue  = ids.filter(id => inDeg[id] === 0);
  let visited  = 0;
  while (queue.length) {
    const node = queue.shift();
    visited++;
    for (const neighbor of adj[node]) {
      inDeg[neighbor]--;
      if (inDeg[neighbor] === 0) queue.push(neighbor);
    }
  }
  assert.strictEqual(visited, ids.length,
    `Cycle detected! Only ${visited}/${ids.length} modules resolved.`);
});

test('Seed', '"quantum-fundamentals" has no prerequisites', () => {
  const mod = curriculum.find(m => m.id === 'quantum-fundamentals');
  assert.ok(mod, 'Module "quantum-fundamentals" not found');
  assert.strictEqual(mod.prerequisites.length, 0,
    'quantum-fundamentals should have zero prerequisites');
});

test('Seed', '"programming-foundations" has no prerequisites', () => {
  const mod = curriculum.find(m => m.id === 'programming-foundations');
  assert.ok(mod, 'Module "programming-foundations" not found');
  assert.strictEqual(mod.prerequisites.length, 0,
    'programming-foundations should have zero prerequisites');
});

test('Seed', 'Only "quantum-fundamentals" and "programming-foundations" have no prerequisites', () => {
  const roots = curriculum.filter(m => m.prerequisites.length === 0).map(m => m.id).sort();
  assert.deepStrictEqual(roots, ['programming-foundations', 'quantum-fundamentals'],
    `Expected exactly two root modules, got: ${JSON.stringify(roots)}`);
});

test('Seed', '"capstone" depends on "parameterized-circuits"', () => {
  const mod = curriculum.find(m => m.id === 'capstone');
  assert.ok(mod, 'Module "capstone" not found');
  assert.ok(mod.prerequisites.includes('parameterized-circuits'),
    'capstone should depend on parameterized-circuits');
});

test('Seed', '"capstone" depends on "circuit-visualization"', () => {
  const mod = curriculum.find(m => m.id === 'capstone');
  assert.ok(mod.prerequisites.includes('circuit-visualization'),
    'capstone should depend on circuit-visualization');
});

test('Seed', '"capstone" has exactly 2 prerequisites', () => {
  const mod = curriculum.find(m => m.id === 'capstone');
  assert.strictEqual(mod.prerequisites.length, 2,
    `Expected 2 prerequisites for capstone, got ${mod.prerequisites.length}`);
});

test('Seed', 'seed.js seeds course with courseId "quantum-dev-101"', () => {
  assert.ok(/courseId\s*:\s*['"]quantum-dev-101['"]/.test(seedSrc),
    'seed.js should reference courseId quantum-dev-101');
});

test('Seed', 'seed.js seeds a test user "student1"', () => {
  assert.ok(/username\s*:\s*['"]student1['"]/.test(seedSrc),
    'seed.js should seed user student1');
});

// ──────────────────────────── 3. API Route Structure Tests ──────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  3. API ROUTE STRUCTURE TESTS                            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const indexSrc = readFile(path.join(GATEWAY, 'index.js'));

test('Routes', 'GET /health endpoint is defined', () => {
  assert.ok(/app\.get\(\s*['"]\/health['"]/.test(indexSrc),
    'GET /health endpoint missing');
});

test('Routes', '/health returns { status: "ok" }', () => {
  assert.ok(/status\s*:\s*['"]ok['"]/.test(indexSrc),
    '/health should return status ok');
});

test('Routes', 'GET /api/curriculum endpoint is defined', () => {
  assert.ok(/app\.get\(\s*['"]\/api\/curriculum['"]/.test(indexSrc),
    'GET /api/curriculum endpoint missing');
});

test('Routes', 'GET /api/progress/:username endpoint is defined', () => {
  assert.ok(/app\.get\(\s*['"]\/api\/progress\/:username['"]/.test(indexSrc),
    'GET /api/progress/:username endpoint missing');
});

test('Routes', 'POST /api/review endpoint is defined (AI code review)', () => {
  assert.ok(/app\.post\(\s*['"]\/api\/review['"]/.test(indexSrc),
    'POST /api/review endpoint missing');
});

test('Routes', 'POST /api/simulate endpoint is defined', () => {
  assert.ok(/app\.post\(\s*['"]\/api\/simulate['"]/.test(indexSrc),
    'POST /api/simulate endpoint missing');
});

test('Routes', 'Language-based queue routing – quantum_jobs queue', () => {
  assert.ok(/quantum_jobs/.test(indexSrc),
    'quantum_jobs queue reference missing');
});

test('Routes', 'Language-based queue routing – cpp_jobs queue', () => {
  assert.ok(/cpp_jobs/.test(indexSrc),
    'cpp_jobs queue reference missing');
});

test('Routes', 'Language routing: cpp → cpp_jobs, else → quantum_jobs', () => {
  assert.ok(/language\s*===?\s*['"]cpp['"]/.test(indexSrc),
    'Language comparison for cpp routing missing');
  assert.ok(/cpp_jobs/.test(indexSrc) && /quantum_jobs/.test(indexSrc),
    'Both queue names should be present');
});

test('Routes', 'Gemini AI integration – GoogleGenerativeAI import', () => {
  assert.ok(/GoogleGenerativeAI/.test(indexSrc),
    'GoogleGenerativeAI import missing');
  assert.ok(/@google\/generative-ai/.test(indexSrc),
    '@google/generative-ai package reference missing');
});

test('Routes', 'Gemini model used is gemini-1.5-flash', () => {
  assert.ok(/gemini-1\.5-flash/.test(indexSrc),
    'Expected gemini-1.5-flash model reference');
});

test('Routes', 'CORS middleware is applied', () => {
  assert.ok(/app\.use\(\s*cors\(\s*\)/.test(indexSrc),
    'CORS middleware missing – expected app.use(cors())');
  assert.ok(/require\(\s*['"]cors['"]\s*\)/.test(indexSrc),
    'cors package import missing');
});

test('Routes', 'Express JSON middleware is applied', () => {
  assert.ok(/app\.use\(\s*express\.json\(\s*\)/.test(indexSrc),
    'express.json() middleware missing');
});

test('Routes', 'Express is imported', () => {
  assert.ok(/require\(\s*['"]express['"]\s*\)/.test(indexSrc),
    'express import missing');
});

test('Routes', 'Mongoose is imported', () => {
  assert.ok(/require\(\s*['"]mongoose['"]\s*\)/.test(indexSrc),
    'mongoose import missing');
});

test('Routes', 'amqplib (RabbitMQ client) is imported', () => {
  assert.ok(/require\(\s*['"]amqplib['"]\s*\)/.test(indexSrc),
    'amqplib import missing');
});

test('Routes', 'Course model is imported', () => {
  assert.ok(/require\(\s*['"]\.\/models\/Course['"]\s*\)/.test(indexSrc),
    'Course model import missing');
});

test('Routes', 'User model is imported', () => {
  assert.ok(/require\(\s*['"]\.\/models\/User['"]\s*\)/.test(indexSrc),
    'User model import missing');
});

test('Routes', 'Server listens on PORT (default 4000)', () => {
  assert.ok(/app\.listen\(\s*PORT/.test(indexSrc), 'app.listen(PORT) missing');
  assert.ok(/PORT\s*\|\|\s*4000/.test(indexSrc), 'Default PORT 4000 missing');
});

test('Routes', '/api/review extracts "code" from request body', () => {
  assert.ok(/const\s*\{\s*code\s*\}\s*=\s*req\.body/.test(indexSrc),
    'Destructuring { code } from req.body missing in /api/review');
});

test('Routes', '/api/simulate validates code is present (400 if missing)', () => {
  assert.ok(/400/.test(indexSrc), 'HTTP 400 status missing for empty code');
  assert.ok(/No code provided/.test(indexSrc) || /!code/.test(indexSrc),
    'Validation for missing code expected');
});

test('Routes', 'Queue unavailable returns 503', () => {
  assert.ok(/503/.test(indexSrc), 'HTTP 503 status missing when queue not ready');
});

// ──────────────────────────── 4. Docker Compose Tests ────────────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  4. DOCKER COMPOSE INFRASTRUCTURE TESTS                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const composeSrc = readFile(COMPOSE);

const EXPECTED_SERVICES = [
  'rabbitmq', 'redis', 'mongodb', 'api-gateway',
  'simulation-worker', 'cpp-worker', 'frontend'
];

test('Docker', 'docker-compose.yml exists and is non-empty', () => {
  assert.ok(composeSrc.length > 0, 'docker-compose.yml should not be empty');
});

for (const svc of EXPECTED_SERVICES) {
  test('Docker', `Service "${svc}" is defined`, () => {
    // Match as a top-level service key (indented under services:)
    const re = new RegExp(`^\\s+${svc.replace('-', '\\-')}:`, 'm');
    assert.ok(re.test(composeSrc), `Service "${svc}" not found in docker-compose.yml`);
  });
}

const EXPECTED_PORTS = ['4000', '5173', '5672', '15672', '6379', '27017'];

for (const port of EXPECTED_PORTS) {
  test('Docker', `Port ${port} is mapped`, () => {
    assert.ok(composeSrc.includes(port),
      `Port ${port} mapping missing in docker-compose.yml`);
  });
}

test('Docker', 'Port 4000 mapped for api-gateway', () => {
  const apiBlock = composeSrc.slice(composeSrc.indexOf('api-gateway:'));
  assert.ok(/4000:4000/.test(apiBlock), 'api-gateway should map port 4000:4000');
});

test('Docker', 'Port 5173 mapped for frontend', () => {
  const feBlock = composeSrc.slice(composeSrc.indexOf('frontend:'));
  assert.ok(/5173:5173/.test(feBlock), 'frontend should map port 5173:5173');
});

test('Docker', 'Port 5672 mapped for rabbitmq (AMQP)', () => {
  const rmqBlock = composeSrc.slice(composeSrc.indexOf('rabbitmq:'), composeSrc.indexOf('redis:'));
  assert.ok(/5672:5672/.test(rmqBlock), 'rabbitmq should map port 5672:5672');
});

test('Docker', 'Port 15672 mapped for rabbitmq (management UI)', () => {
  const rmqBlock = composeSrc.slice(composeSrc.indexOf('rabbitmq:'), composeSrc.indexOf('redis:'));
  assert.ok(/15672:15672/.test(rmqBlock), 'rabbitmq should map port 15672:15672');
});

test('Docker', 'Port 6379 mapped for redis', () => {
  const redisBlock = composeSrc.slice(composeSrc.indexOf('redis:'), composeSrc.indexOf('mongodb:'));
  assert.ok(/6379:6379/.test(redisBlock), 'redis should map port 6379:6379');
});

test('Docker', 'Port 27017 mapped for mongodb', () => {
  const mongoBlock = composeSrc.slice(composeSrc.indexOf('mongodb:'), composeSrc.indexOf('api-gateway:'));
  assert.ok(/27017:27017/.test(mongoBlock), 'mongodb should map port 27017:27017');
});

test('Docker', 'quantum_network is defined', () => {
  assert.ok(/quantum_network/.test(composeSrc), 'quantum_network not found');
});

test('Docker', 'quantum_network uses bridge driver', () => {
  const netBlock = composeSrc.slice(composeSrc.lastIndexOf('networks:'));
  assert.ok(/driver\s*:\s*bridge/.test(netBlock), 'quantum_network should use bridge driver');
});

test('Docker', 'All services are on quantum_network', () => {
  // Each service block should reference quantum_network
  for (const svc of EXPECTED_SERVICES) {
    const re = new RegExp(svc.replace('-', '\\-') + ':[\\s\\S]*?quantum_network', 'm');
    assert.ok(re.test(composeSrc),
      `Service "${svc}" should be on quantum_network`);
  }
});

test('Docker', 'mongodb_data volume is defined for persistence', () => {
  assert.ok(/mongodb_data/.test(composeSrc), 'mongodb_data volume missing');
});

test('Docker', 'mongodb service uses mongodb_data volume', () => {
  const mongoBlock = composeSrc.slice(composeSrc.indexOf('mongodb:'), composeSrc.indexOf('api-gateway:'));
  assert.ok(/mongodb_data/.test(mongoBlock), 'mongodb service should mount mongodb_data volume');
});

test('Docker', 'mongodb_data is declared as a named volume', () => {
  // Should appear under top-level volumes: key
  const volSection = composeSrc.slice(composeSrc.lastIndexOf('volumes:'));
  assert.ok(/mongodb_data/.test(volSection), 'mongodb_data should be a named volume');
});

test('Docker', 'api-gateway depends on mongodb, redis, and rabbitmq', () => {
  const apiBlock = composeSrc.slice(
    composeSrc.indexOf('api-gateway:'),
    composeSrc.indexOf('simulation-worker:')
  );
  assert.ok(/mongodb/.test(apiBlock), 'api-gateway should depend on mongodb');
  assert.ok(/redis/.test(apiBlock),   'api-gateway should depend on redis');
  assert.ok(/rabbitmq/.test(apiBlock), 'api-gateway should depend on rabbitmq');
});

test('Docker', 'simulation-worker depends on rabbitmq', () => {
  const workerBlock = composeSrc.slice(
    composeSrc.indexOf('simulation-worker:'),
    composeSrc.indexOf('cpp-worker:')
  );
  assert.ok(/rabbitmq/.test(workerBlock), 'simulation-worker should depend on rabbitmq');
});

test('Docker', 'cpp-worker depends on rabbitmq', () => {
  const cppBlock = composeSrc.slice(
    composeSrc.indexOf('cpp-worker:'),
    composeSrc.indexOf('frontend:')
  );
  assert.ok(/rabbitmq/.test(cppBlock), 'cpp-worker should depend on rabbitmq');
});

test('Docker', 'frontend has VITE_API_URL environment variable', () => {
  const feBlock = composeSrc.slice(composeSrc.indexOf('frontend:'));
  assert.ok(/VITE_API_URL/.test(feBlock), 'frontend should set VITE_API_URL');
});

test('Docker', 'rabbitmq uses official management image', () => {
  assert.ok(/rabbitmq:3-management/.test(composeSrc),
    'rabbitmq should use rabbitmq:3-management image');
});

test('Docker', 'redis uses alpine image', () => {
  assert.ok(/redis:alpine/.test(composeSrc), 'redis should use redis:alpine image');
});

test('Docker', 'mongodb uses mongo:latest image', () => {
  assert.ok(/mongo:latest/.test(composeSrc), 'mongodb should use mongo:latest image');
});

// ──────────────────────────── Summary ────────────────────────────

console.log('\n══════════════════════════════════════════════════════════');
console.log(`  TOTAL : ${passed + failed}`);
console.log(`  PASS  : ${passed}`);
console.log(`  FAIL  : ${failed}`);
console.log('══════════════════════════════════════════════════════════');

if (failures.length) {
  console.log('\nFailed tests:');
  for (const f of failures) {
    console.log(`  ✖ ${f.label}`);
    console.log(`    → ${f.message}`);
  }
}

console.log('');
process.exit(failed > 0 ? 1 : 0);
