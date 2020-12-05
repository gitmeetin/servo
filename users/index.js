"use strict";

require("dotenv").config();

const cassandra = require("cassandra-driver");
const { v4 } = require("uuid");

const { USERNAME, PASSWORD } = process.env;

if (!USERNAME) throw new Error("Environment variable USERNAME not set");
if (!PASSWORD) throw new Error("Environment variable PASSWORD not set");

// Docs and references
// https://cassandra.apache.org/doc/latest/cql/ddl.html#create-table

// useful for determining container re-use
const myuuid = cassandra.types.TimeUuid.now();
console.log("timeuuid in container startup: " + myuuid);

const client = new cassandra.Client({
  cloud: { secureConnectBundle: "../secure-connect-gitmeet.zip" },
  credentials: { username: USERNAME, password: PASSWORD },
});

const Mapper = cassandra.mapping.Mapper;

client.on("log", (level, loggerName, message, furtherInfo) => {
  console.log(`${level} - ${loggerName}:  ${message}`);
});

const mapper = new Mapper(client, {
  models: {
    User: { tables: ["users"], keyspace: "gitmeet" },
    Project: { tables: ["projects"], keyspace: "gitmeet" },
    Meeting: { tables: ["meetings"], keyspace: "gitmeet" },
  },
});

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createSchema = async (req, res) => {
  console.log("timeuuid in createSchema: " + myuuid);

  if (req.method !== "POST") {
    return res.status(404).json({ body: "Error: Requested method not found!" });
  }

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

    res.json({
      success: true,
      body: `Successfully created ${keyspace}.${table} schema`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ body: "Error: Table could not be created!" });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.getUser = async (req, res) => {
  console.log("timeuuid in getUser: " + myuuid);

  if (req.method !== "GET") {
    return res.status(404).json({ body: "Error: Requested method not found!" });
  }

  const table = "users";
  const keyspace = "gitmeet";

  const userId = req.params[0];

  if (!userId) {
    return res.status(400).json({
      body: `Error: Required fields are missing. UserId not found!`,
    });
  }

  const params = [userId.toString()];

  try {
    const getUser = `SELECT
      id as userId,
      liked_projects as likedProjects,
      personal_projects as personalProjects,
      auth_token as authToken,
      created_at as createdAt,
      name,
      username,
      schedules FROM ${keyspace}.${table} WHERE id=?`;

    const result = await client.execute(getUser, params, {
      prepare: true,
    });

    const {
      userid,
      name,
      username,
      schedules,
      likedprojects,
      personalprojects,
      authtoken,
      createdat,
    } = result.first();

    res.json({
      success: true,
      body: {
        userId: userid,
        name,
        username,
        schedules,
        likedProjects: likedprojects,
        personalProjects: personalprojects,
        authToken: authtoken,
        createdAt: createdat,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(404)
      .json({ body: `Error: UserId ${userId} could not be found!` });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createUser = async (req, res) => {
  console.log("timeuuid in createUser: " + myuuid);

  if (req.method !== "POST") {
    return res.status(404).json({ body: "Error: Requested method not found!" });
  }

  const userMapper = mapper.forModel("User");

  const table = "users";
  const keyspace = "gitmeet";

  const createUser =
    `INSERT INTO ${keyspace}.${table} (id, 
    name,
    username,
    schedules,
    liked_projects,
    personal_projects,
    auth_token,
    created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)` + ` IF NOT EXISTS`;

  try {
    const { name, username, personalProjects, authToken } = req.body;

    if (!name || !username || !personalProjects || !authToken) {
      return res.status(400).json({
        body: `Error: Required fields are missing. User not created!`,
      });
    }

    const oldUsers = await userMapper.findAll({ username });

    if (oldUsers.length > 0) {
      return res.status(400).json({
        body: `Error: User already exists with username - ${username}. New User not created!`,
      });
    }

    const userId = v4();
    const createdAt = new Date();

    const params = [
      userId,
      name,
      username,
      [],
      [],
      personalProjects,
      authToken,
      createdAt,
    ];

    await client.execute(createUser, params, {
      prepare: true,
      isIdempotent: true,
    });

    res.json({
      success: true,
      body: {
        userId,
        name,
        username,
        schedules: [],
        likedProjects: [],
        personalProjects,
        authToken,
        createdAt,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ body: `Error: Something went wrong. User not registered!` });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.editUser = async (req, res) => {
  console.log("timeuuid in editUser: " + myuuid);

  if (req.method !== "POST") {
    return res.status(404).json({ body: "Error: Requested method not found!" });
  }

  const userMapper = mapper.forModel("User");

  try {
    const { userId, schedule, likedProject, personalProject } = req.body;

    if (!userId || (!schedule && !personalProject && !likedProject)) {
      return res.status(400).json({
        body: `Error: Update fields are missing. User not updated!`,
      });
    }

    const oldUsers = await userMapper.findAll({ id: userId });

    if (oldUsers.length === 0) {
      return res.status(400).json({
        body: `Error: User not found!`,
      });
    }

    const oldUser = oldUsers.first();

    console.log(oldUser);

    const newSchedules = oldUser.schedules || [];
    const likedProjects = oldUser.liked_projects || [];
    const personalProjects = oldUser.personal_projects || [];

    if (schedule) newSchedules.push(schedule);
    if (likedProject) likedProjects.push(likedProject);
    if (personalProject) personalProjects.push(personalProject);

    console.log(newSchedules, likedProjects, personalProjects);

    await userMapper.update({
      id: userId,
      username: oldUser.username,
      name: oldUser.name,
      schedules: newSchedules,
      liked_projects: likedProjects,
      personal_projects: personalProjects,
      auth_token: oldUser.auth_token,
      created_at: oldUser.created_at,
    });

    res.json({
      success: true,
      body: "User details updated!",
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ body: `Error: Something went wrong. User details not updated!` });
  }
};
