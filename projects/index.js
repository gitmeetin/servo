const { v4 } = require('uuid');
const { Client, TimeUuid } = require('cassandra-driver');

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

client.on('log', (level, loggerName, message, furtherInfo) => {
  console.log(`${level} - ${loggerName}:  ${message}`);
});

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createSchema = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(400).json({ message: 'Error: Requested method not found!' });
  }

  const createTable = `
    CREATE TYPE swipes (
      swipedBy text,
      swipedUser text,
      liked boolean
    )

    CREATE TABLE IF NOT EXISTS ${DATABASE}.projects (
      id text,
      name text,
      author text,
      readme text,
      location text,
      tags list<text>,
      swipes list<swipes>,
      repo_id text,
      repo_link text,
      PRIMARY KEY(id, repo_id, location)
    )
  `;

  try {
    await client.execute(createTable);

    return res.json({
      message: `Successfully created ${DATABASE}.projects schema`
    });
  } catch (_) {
    console.error(_);
    return res.status(500).json({
      message: `Error: ${DATABASE}.projects couldn't be created`
    });
  }
};