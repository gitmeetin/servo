const { Client, TimeUuid, mapping: { Mapper } } = require('cassandra-driver');

const { USERNAME, PASSWORD, DATABASE } = process.env;

if (!USERNAME) throw new Error('Environment variable USERNAME not set');
if (!PASSWORD) throw new Error('Environment variable PASSWORD not set');
if (!DATABASE) throw new Error('Environment variable DATABASE not set');

const myuuid = TimeUuid.now();
console.log('timeuuid in container startup: ' + myuuid);

const client = new Client({
  cloud: { secureConnectBundle: '../secure-connect-gitmeet.zip' },
  credentials: { username: USERNAME, password: PASSWORD },
});

const mapper = new Mapper(client, {
  models: {
    User: { tables: ['users'], keyspace: 'gitmeet' },
    Project: { tables: ['projects'], keyspace: 'gitmeet' },
    Meeting: { tables: ['meetings'], keyspace: 'gitmeet' },
  },
});

client.on('log', (level, loggerName, message, furtherInfo) => {
  console.log(`${level} - ${loggerName}:  ${message}`);
});

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createSchema = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  const createSchema = `
    CREATE TABLE IF NOT EXISTS ${DATABASE}.meetings (
      id text,
      owner text,
      liker text,
      link text,
      time TIMESTAMP,
      PRIMARY KEY (id)
    )
  `;

  try {
    await client.execute(createSchema);

    return res.json({ message: 'Created meetings schema' });
  } catch (_) {
    console.error(_);
    return res.status(500).json({ message: 'Could not create meetings schema' });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.getMeeting = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  const meetingID = req.params[0];

  try {
    const selectQuery = `SELECT * FROM ${DATABASE}.projects WHERE id = ?`;
    const result = (await client.execute(selectQuery, [meetingID], { prepare: true })).first();

    return res.json({ message: 'Found the meeting', body: result });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: 'Could not find the meeting' });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createMeeting = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  //
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.deleteMeeting = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  //
};
