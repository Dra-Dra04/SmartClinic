const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const cache = new Map();
// Exercise the real API/adapters in Node without loading React Native's native runtime.
function load(file) {
  file = path.resolve(__dirname, '../src/api', file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(
    name => name === 'react-native' ? { Platform: { OS: 'android' } } :
      name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), module, module.exports);
  return module.exports;
}
const client = load('client.ts');
const patient = load('patient.ts');
const articles = load('articles.ts');
const user = { id: 'u1', role: 'patient', email: 'a@example.com', phone: '0912345678', fullName: 'Test',
  gender: 'Khác', dateOfBirth: '2000-02-29', address: 'Hà Nội', healthInsuranceNumber: 'TEST',
  isProfileCompleted: false, allergies: ['line one', 'line two'] };

test('API contracts and failure handling', async t => {
  const original = global.fetch;
  try {
    await t.test('JSON request includes bearer token and content type', async () => {
      global.fetch = async (url, options) => {
        assert.equal(url, client.API_URL + '/api/patients/me');
        assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
        assert.equal(options.headers.get('Content-Type'), 'application/json');
        return new Response('{"ok":true}', { status: 200 });
      };
      assert.deepEqual(await client.request('/api/patients/me', { method: 'PUT', body: '{}' }, 'test-token'), { ok: true });
    });
    await t.test('multipart boundary is left to fetch', async () => {
      global.fetch = async (_, options) => {
        assert.equal(options.headers.has('Content-Type'), false);
        assert.ok(options.body instanceof FormData);
        return new Response('{}');
      };
      await client.request('/api/patients/me/avatar', { method: 'POST', body: new FormData() }, 'key');
    });
    await t.test('validation errors and 401 preserve status', async () => {
      global.fetch = async () => new Response(JSON.stringify({ errors: { Phone: ['Invalid phone'] } }), { status: 400 });
      await assert.rejects(client.request('/test'), e => e.status === 400 && e.message === 'Invalid phone');
      global.fetch = async () => new Response('', { status: 401 });
      await assert.rejects(client.request('/test'), e => e instanceof client.ApiError && e.status === 401);
    });
    await t.test('network failure gives actionable message', async () => {
      global.fetch = async () => { throw new TypeError('fetch failed'); };
      await assert.rejects(client.request('/test'), /Không kết nối/);
    });
    await t.test('profile mapping preserves unknown values and medical text', () => {
      const mapped = patient.toProfile({ ...user, fullName: null, heightCm: null, weightKg: null, allergies: 'A, B\nC', medicalHistory: null, avatarUrl: null });
      assert.equal(mapped.heightCm, undefined); assert.equal(mapped.fullName, '');
      assert.deepEqual(mapped.allergies, ['A, B', 'C']);
    });
    await t.test('PUT omits identity/role/email and serializes optional values to null', () => {
      const body = patient.profilePayload(user);
      assert.equal(body.heightCm, null); assert.equal(body.idCardNumber, null);
      assert.equal(body.allergies, 'line one\nline two');
      for (const field of ['email', 'id', 'role', 'isProfileCompleted']) assert.equal(field in body, false);
    });
    await t.test('invalid calendar date, identity and numeric values rejected', () => {
      assert.throws(() => patient.profilePayload({ ...user, dateOfBirth: '2001-02-29' }), /Ngày sinh/);
      assert.throws(() => patient.profilePayload({ ...user, dateOfBirth: '29\/02\/2000' }), /Ngày sinh/);
      assert.throws(() => patient.profilePayload({ ...user, healthInsuranceNumber: '' }), /CCCD/);
      assert.throws(() => patient.profilePayload({ ...user, heightCm: NaN }), /Chiều cao/);
    });
    await t.test('avatar from web uses the mobile API and bearer authentication', () => {
      for (const avatarUrl of ['/api/patients/me/avatar?v=web1', 'https://localhost:7295/api/patients/me/avatar?v=web2']) {
        const profile = { ...user, avatarUrl };
        const source = patient.patientAvatarSource('test-token', profile, 42);
        const url = new URL(source.uri);
        assert.equal(url.origin, new URL(client.API_URL).origin);
        assert.equal(url.pathname, '/api/patients/me/avatar');
        assert.equal(url.searchParams.get('version'), avatarUrl);
        assert.equal(url.searchParams.get('u'), user.id);
        assert.equal(source.headers.Authorization, 'Bearer test-token');
        assert.notEqual(source.uri, patient.patientAvatarSource('test-token', profile, 43).uri);
      }
      assert.equal(patient.patientAvatarSource(undefined, { ...user, avatarUrl: 'image' }, 0), undefined);
      assert.equal(patient.patientAvatarSource('test-token', user, 0), undefined);
    });
    await t.test('article pagination and encoded detail slug', async () => {
      const article = { slug: 'tin mới', title: 'Tin', categoryName: 'Danh mục mới', authorDisplayName: 'Tác giả', summary: 'Tóm tắt', publishedAtUtc: null, coverMediaId: null };
      global.fetch = async url => {
        assert.ok(url.endsWith('/api/articles?page=2'));
        return new Response(JSON.stringify({ items: [article], hasMore: true }));
      };
      const list = await articles.listArticles(2);
      assert.equal(list.hasMore, true); assert.equal(list.items[0].image, '');
      global.fetch = async url => {
        assert.ok(url.endsWith('/api/articles/tin%20m%E1%BB%9Bi'));
        return new Response(JSON.stringify({ ...article, contentText: 'Text[[image:12345678901234567890123456789012]]End' }));
      };
      const detail = await articles.getArticle(article.slug);
      assert.equal(detail.content.length, 3);
    });
  } finally { global.fetch = original; }
});
