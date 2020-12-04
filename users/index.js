"use strict";

require("dotenv").config();

const cassandra = require("cassandra-driver");
const { v4 } = require("uuid");

const { USERNAME, PASSWORD } = process.env;

if (!USERNAME) throw new Error("Environment variable USERNAME not set");
if (!PASSWORD) throw new Error("Environment variable PASSWORD not set");

console.log(USERNAME, PASSWORD);

// useful for determining container re-use
const myuuid = cassandra.types.TimeUuid.now();
console.log("timeuuid in container startup: " + myuuid);

const client = new cassandra.Client({
  cloud: { secureConnectBundle: "../secure-connect-gitmeet.zip" },
  credentials: { username: USERNAME, password: PASSWORD },
});

client.on("log", (level, loggerName, message, furtherInfo) => {
  console.log(`${level} - ${loggerName}:  ${message}`);
});

exports.createSchema = async (req, res) => {
  const table = "users";
  const keyspace = "gitmeet";

  const createTable =
    `CREATE TABLE IF NOT EXISTS ${keyspace}.${table} (id text,
                                                      name text,
                                                      username text,
                                                      schedules list<text>,
                                                      liked_projects list<text>,
                                                      personal_projects list<text>,
                                                      auth_token text,
                                                      created_at timestamp, ` + `PRIMARY KEY (id, username))`;

  try {
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

exports.getSingle = async (req, res) => {
  const { userId } = req.body;

  const params = [userId];

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

    const result = await client.execute(getUser, params, {
      prepare: true,
    });
    const {
      name,
      username,
      schedules,
      likedProjects,
      personalProjects,
      token,
      createdAt,
    } = result.first();

    res.status(200).json({
      success: true,
      body: {
        userId,
        name,
        username,
        schedules,
        likedProjects,
        personalProjects,
        token,
        createdAt,
      },
    });
  } catch (err) {
    console.log(error);
    return res
      .status(400)
      .json({ body: `Error: UserId ${userId} could not be found!` });
  }
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
