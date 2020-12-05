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
    return res.status(404).json({ message: 'Error: Requested method not found!' });
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

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.getProject = (req, res) => {
  const projectID = req.params[0];

  if (req.method !== 'GET') {
    return res.status(404).json({ message: 'Error: Requested method not found!' });
  }

  try {
    const selectQuery = `SELECT 
    id, name, author, readme, location, tags, repo_id, repo_link FROM ${DATABASE}.projects WHERE id = ?`;
    const projectDetails = (await client.execute(selectQuery, [projectID], { prepare: true })).first();

    return res.json({ body: projectDetails });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: `Error: Could not find project with ID ${projectID}` })
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.deleteProject = (req, res) => {
  const projectID = req.params[0];

  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Error: Requested method not found!' });
  }

  try {
    const deleteQuery = `DELETE FROM ${DATABASE}.projects WHERE id = ?`;
    await client.execute(deleteQuery, [projectID], { prepare: true });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: `Error: Could not find and delete a project with ID ${projectID}`});
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.editProject = (req, res) => {
  /**
   * Workflow: Client request refresh > POST req here > we fetch data off github > re-write our DB
   *  - if github returns 404, we'll assume the repo has been deleted
   * 
   * Since this requires integration with github API and we also need the user's PAT, the code below
   * is just mock on how the logic will be
   */
  const projectID = req.params[0];

  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Error: Requested method not found!' });
  }

  // Mock starts here
  try {
    const { readme, tags, id, ... } = await githubClient(projectID);
    const updateQuery = `UPDATE ${DATABASE}.projects SET ...... WHERE id = ?`;

    await client.execute(updateQuery, [ ... ], { prepare: true });
    return res.json({ message: 'Refreshed project details successfully' });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: 'Error: Access denied trying to access the repository in github' });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.swipeProject = (req, res) => {

};
