const test = require('node:test');
const assert = require('node:assert');
const authController = require('../src/controllers/authController');
const translationController = require('../src/controllers/translationController');
const vocabularyController = require('../src/controllers/vocabularyController');
const { inMemoryUsers } = require('../src/middleware/auth');

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(k, v) {
      this.headers[k] = v;
    },
  };
  return res;
}

let registeredToken;
let testUserId;
let createdTranslationId;

test('Auth: Register new user', async () => {
  const req = {
    body: {
      name: 'ISL Tester',
      email: `isl_test_${Date.now()}@example.com`,
      password: 'strongPassword123',
    },
  };
  const res = createMockRes();
  let nextCalled = false;
  await authController.register(req, res, (err) => { nextCalled = true; });

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.token);
  assert.ok(res.body.user);
  assert.strictEqual(res.body.user.name, 'ISL Tester');

  registeredToken = res.body.token;
  testUserId = res.body.user.id;
});

test('Auth: Reject duplicate email registration', async () => {
  const email = `isl_dup_${Date.now()}@example.com`;
  const req1 = {
    body: { name: 'User 1', email, password: 'password123' },
  };
  const res1 = createMockRes();
  await authController.register(req1, res1, () => {});
  assert.strictEqual(res1.statusCode, 201);

  const req2 = {
    body: { name: 'User 2', email, password: 'password123' },
  };
  const res2 = createMockRes();
  await authController.register(req2, res2, () => {});
  assert.strictEqual(res2.statusCode, 409);
  assert.strictEqual(res2.body.success, false);
});

test('Auth: Login with valid credentials', async () => {
  const email = `isl_login_${Date.now()}@example.com`;
  await authController.register(
    { body: { name: 'Login User', email, password: 'correctPassword123' } },
    createMockRes(),
    () => {}
  );

  const req = {
    body: { email, password: 'correctPassword123' },
  };
  const res = createMockRes();
  await authController.login(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.token);
});

test('Auth: Reject invalid password on login', async () => {
  const email = `isl_fail_${Date.now()}@example.com`;
  await authController.register(
    { body: { name: 'Fail User', email, password: 'correctPassword123' } },
    createMockRes(),
    () => {}
  );

  const req = {
    body: { email, password: 'wrongPassword!' },
  };
  const res = createMockRes();
  await authController.login(req, res, () => {});

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.body.success, false);
});

test('Auth: Get and update user profile', async () => {
  const req = {
    user: {
      id: testUserId,
      _id: testUserId,
      name: 'ISL Tester',
      email: 'test@example.com',
      preferredInterfaceLanguage: 'en',
      preferredSpeechLanguage: 'en-IN',
      saveHistoryEnabled: true,
    },
  };
  const res = createMockRes();
  await authController.getMe(req, res, () => {});
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.user.id, testUserId);

  const updateReq = {
    user: req.user,
    body: {
      preferredSpeechLanguage: 'hi-IN',
      saveHistoryEnabled: false,
    },
  };
  const updateRes = createMockRes();
  await authController.updateMe(updateReq, updateRes, () => {});
  assert.strictEqual(updateRes.statusCode, 200);
  assert.strictEqual(updateRes.body.user.preferredSpeechLanguage, 'hi-IN');
  assert.strictEqual(updateRes.body.user.saveHistoryEnabled, false);
});

test('Vocabulary: Retrieve categories', async () => {
  const res = createMockRes();
  await vocabularyController.getCategories({}, res, () => {});
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.categories.length >= 5);
});

test('Translation: Save confirmed translation', async () => {
  const req = {
    user: {
      id: testUserId,
      _id: testUserId,
      saveHistoryEnabled: true,
    },
    body: {
      recognizedText: 'HELP',
      supportedSignIds: ['H', 'E', 'L', 'P'],
      category: 'healthcare',
      confidenceMetadata: { averageConfidence: 0.92 },
      userCorrectedText: 'I NEED HELP',
    },
  };
  const res = createMockRes();
  await translationController.saveTranslation(req, res, () => {});

  assert.strictEqual(res.statusCode, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.translation);
  assert.strictEqual(res.body.translation.recognizedText, 'HELP');
  assert.strictEqual(res.body.translation.userCorrectedText, 'I NEED HELP');
  createdTranslationId = res.body.translation._id;
});

test('Translation: Retrieve user translation history with search', async () => {
  const req = {
    user: {
      id: testUserId,
      _id: testUserId,
    },
    query: {
      search: 'HELP',
      page: 1,
      limit: 10,
    },
  };
  const res = createMockRes();
  await translationController.getHistory(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.translations.length > 0);
  assert.strictEqual(res.body.translations[0].recognizedText, 'HELP');
});

test('Translation: Delete translation by id', async () => {
  const req = {
    user: {
      id: testUserId,
      _id: testUserId,
    },
    params: {
      id: createdTranslationId,
    },
  };
  const res = createMockRes();
  await translationController.deleteTranslation(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
});

test('Translation: Clear all history', async () => {
  const req = {
    user: {
      id: testUserId,
      _id: testUserId,
    },
  };
  const res = createMockRes();
  await translationController.clearHistory(req, res, () => {});

  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(res.body.success, true);
});
