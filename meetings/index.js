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
exports.createSchema = (req, res) => {

};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.getMeeting = (req, res) => {

};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createMeeting = (req, res) => {
  
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.deleteMeeting = (req, res) => {

};
