const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadHelper(name, dependencies, env = {}) {
  const sandbox = {
    module: { exports: {} },
    require: (id) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
      return dependencies[id];
    },
    process: { env },
    console: { error() {} },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../helper', name), 'utf8'), sandbox);
  return sandbox.module.exports;
}

test('concurrent requests share a connection and a failure can be retried', async () => {
  let attempts = 0;
  const mongoose = {
    connection: { readyState: 0 },
    connect: async () => {
      attempts++;
      if (attempts === 1) throw new Error('Temporary outage');
      mongoose.connection.readyState = 1;
      return mongoose;
    },
  };
  const connect = loadHelper('database.js', { mongoose }, { CONNECTION_STRING: 'mongodb://test.invalid/agri' });
  const failures = await Promise.allSettled([connect(), connect()]);
  assert.ok(failures.every((result) => result.status === 'rejected'));
  assert.equal(attempts, 1);
  await connect();
  await connect();
  assert.equal(attempts, 2);
});

test('missing database settings fail without attempting a connection', async () => {
  const connect = loadHelper('database.js', {
    mongoose: { connection: { readyState: 0 }, connect() { assert.fail('Unexpected connection'); } },
  });
  await assert.rejects(connect(), /CONNECTION_STRING/);
});

test('integration URI works when the manual setting is empty; manual setting takes priority', async () => {
  for (const manual of ['', '  ', 'mongodb://manual.invalid/agri']) {
    let connectedUri;
    const connect = loadHelper('database.js', {
      mongoose: { connection: { readyState: 0 }, connect: async (uri) => { connectedUri = uri; } },
    }, { CONNECTION_STRING: manual, MONGODB_URI: 'mongodb://integration.invalid/agri' });
    await connect();
    assert.equal(connectedUri, manual.trim() || 'mongodb://integration.invalid/agri');
  }
});

test('incorrectly pasted settings fail before connecting and diagnostics contain no credentials', async () => {
  const connect = loadHelper('database.js', {
    mongoose: { connection: { readyState: 0 }, connect() { assert.fail('Unexpected connection'); } },
  }, { CONNECTION_STRING: 'MONGODB_URI="mongodb://user:private-password@host/agri"' });
  await assert.rejects(connect(), (error) => error.code === 'DB_URI_INVALID');
  for (const [error, expected] of [
    [{ code: 'DB_URI_MISSING' }, 'DB_URI_MISSING'],
    [{ name: 'MongoParseError' }, 'DB_URI_INVALID'],
    [{ code: 18 }, 'DB_AUTH_FAILED'],
    [{ code: 'ENOTFOUND' }, 'DB_DNS_FAILED'],
    [{ message: 'querySrv ECONNREFUSED' }, 'DB_DNS_FAILED'],
    [{ name: 'MongooseServerSelectionError' }, 'DB_NETWORK_FAILED'],
    [{ message: 'mongodb://user:private-password@host/agri' }, 'DB_CONNECTION_FAILED'],
  ]) {
    const result = connect.diagnose(error);
    assert.equal(result.code, expected);
    assert.ok(!JSON.stringify(result).includes('private-password'));
  }
});

function uploadHarness() {
  const records = [];
  const multer = () => ({ array: () => (req, res, next) => next(req.parseError) });
  multer.memoryStorage = () => ({});
  const helper = loadHelper('uploadImages.js', {
    multer,
    '../utils/cloudinary': { uploader: {
      upload_stream: (options, callback) => ({ end: (buffer) => {
        setImmediate(() => buffer.toString() === 'fail'
          ? callback(new Error('Cloud unavailable'))
          : callback(null, { secure_url: `https://images.example/${buffer.toString()}` }));
      } }),
    } },
    '../models/imageUpload': { ImageUpload: { create: async (record) => records.push(record) } },
  });
  function upload(files, parseError) {
    return new Promise((resolve) => {
      const res = { statusCode: 200, status(code) { this.statusCode = code; return this; },
        json(body) { resolve({ status: this.statusCode, body }); } };
      helper.uploadImages({ files, parseError }, res);
    });
  }
  return { ...helper, records, upload };
}

test('concurrent image uploads keep each request separate', async () => {
  const harness = uploadHarness();
  const result = await Promise.all(['first', 'second'].map((value) =>
    harness.upload([{ buffer: Buffer.from(value), size: value.length }])));
  assert.equal(result[0].status, 200);
  assert.equal(result[1].status, 200);
  assert.equal(JSON.stringify(result[0].body), '["https://images.example/first"]');
  assert.equal(JSON.stringify(result[1].body), '["https://images.example/second"]');
  assert.equal(harness.records.length, 2);
});

test('empty, oversized, and failed uploads return errors without recording success', async () => {
  const harness = uploadHarness();
  assert.equal((await harness.upload([])).status, 400);
  assert.equal((await harness.upload([{ size: 5 * 1024 * 1024 }])).status, 413);
  assert.equal((await harness.upload([], { code: 'LIMIT_FILE_SIZE', message: 'Too large' })).status, 413);
  assert.equal((await harness.upload([{ size: 4, buffer: Buffer.from('fail') }])).status, 502);
  assert.equal(harness.records.length, 0);
});

test('image saves accept client URLs and admin preview objects and remove duplicates', () => {
  const { imageUrls } = uploadHarness();
  assert.equal(JSON.stringify(imageUrls([
    'https://images.example/one', { img: 'https://images.example/two', id: 'preview' },
    { img: 'https://images.example/one' }, null, {}, 'invalid',
  ])), '["https://images.example/one","https://images.example/two"]');
});

test('Express imports without binding a port and reports unavailable database', async () => {
  process.env.CONNECTION_STRING = '';
  process.env.MONGODB_URI = '';
  const app = require('../index');
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const root = await fetch(base);
    assert.equal(root.status, 200);
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 503);
    const result = await health.json();
    assert.equal(result.success, false);
    assert.equal(result.code, 'DB_URI_MISSING');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
