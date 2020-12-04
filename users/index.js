"use strict";

require("dotenv").config();

const cassandra = require("cassandra-driver");
const { v4 } = require("uuid");

const { USERNAME, PASSWORD } = process.env;

if (!USERNAME) throw new Error("Environment variable USERNAME not set");
if (!PASSWORD) throw new Error("Environment variable PASSWORD not set");

const keyspace = "gitmeet";

// useful for determining container re-use
const myuuid = cassandra.types.TimeUuid.now();
console.log("timeuuid in container startup: " + myuuid);

const client = new cassandra.Client({
  cloud: { secureConnectBundle: "../secure-connect-gitmeet.zip" },
  credentials: { USERNAME, PASSWORD },
});

client.on("log", (level, loggerName, message, furtherInfo) => {
  console.log(`${level} - ${loggerName}:  ${message}`);
});

exports.createSchema = async (req, res) => {
  const table = "users";
  const keyspace = "gitmeet";

  const createKeyspace = `CREATE KEYSPACE IF NOT EXISTS ${keyspace} `;

  const createTable =
    `
  CREATE TABLE IF NOT EXISTS ${keyspace}.${table} (
    id text,
    name text,
    username text,
    schedules list,
    liked_projects list,
    personal_projects list,
    token text,
    created_at timestamp,
  ` + ` PRIMARY KEY (id, username)`;

  try {
    await client.execute(createKeyspace);
    await client.execute(createTable);

    res.status(200).json({
      success: true,
      body: `Successfully created ${keyspace}.${table} schema`,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .json({ body: "Error: Table and Keyspace could not be created!" });
  }
};

exports.getUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const getUser = `
    SELECT 
      id as userId,
      name,
      username,
      schedules,
      liked_projects AS likedProjects,
      personal_projects as personalProjects,
      token,
      created_at as createdAt FROM users WHERE id=${userId}
    `;
  } catch (err) {}
};

//Ensure all queries are executed before exit
function execute(query, params, callback) {
  return new Promise((resolve, reject) => {
    client.execute(query, params, (err, result) => {
      if (err) {
        reject();
      } else {
        callback(err, result);
        resolve();
      }
    });
  });
}
