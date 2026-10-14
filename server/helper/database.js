const mongoose = require('mongoose');

let connectionPromise;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose;
  const uri = (process.env.CONNECTION_STRING || '').trim()
    || (process.env.MONGODB_URI || '').trim();
  if (!uri) {
    const error = new Error('Set CONNECTION_STRING or MONGODB_URI in the server project and redeploy.');
    error.code = 'DB_URI_MISSING';
    throw error;
  }
  if (!/^mongodb(?:\+srv)?:\/\//.test(uri)) {
    const error = new Error('The database value must begin with mongodb:// or mongodb+srv://, without a variable name or quotes.');
    error.code = 'DB_URI_INVALID';
    throw error;
  }
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 5,
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }
  return connectionPromise;
}

module.exports = connectDatabase;

// Classify errors without logging a connection URL, password, or driver stack.
module.exports.diagnose = (error) => {
  const message = String(error?.message || '');
  const code = error?.code || error?.cause?.code;
  if (code === 'DB_URI_MISSING') {
    return { code, hint: 'Set CONNECTION_STRING or MONGODB_URI for Production, then redeploy.' };
  }
  if (code === 'DB_URI_INVALID' || error?.name === 'MongoParseError') {
    return { code: 'DB_URI_INVALID', hint: 'Paste the complete MongoDB URL without a variable name, quotes, or placeholders.' };
  }
  if (code === 18 || /authentication failed|bad auth/i.test(message)) {
    return { code: 'DB_AUTH_FAILED', hint: 'Check the Atlas database username and password, URL encoding, and authSource.' };
  }
  if (['ENOTFOUND', 'EAI_AGAIN', 'ENODATA', 'ESERVFAIL', 'EREFUSED'].includes(code) || /querySrv|queryTxt|getaddrinfo/i.test(message)) {
    return { code: 'DB_DNS_FAILED', hint: 'Check the full Atlas cluster hostname and that the cluster is available.' };
  }
  if (/ServerSelection|Network|Timeout/.test(error?.name || '') || ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(code)) {
    return { code: 'DB_NETWORK_FAILED', hint: 'Check Atlas Network Access, cluster availability, and connectivity from Vercel.' };
  }
  return { code: 'DB_CONNECTION_FAILED', hint: 'Check database configuration and Atlas cluster status.' };
};
