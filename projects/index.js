const { Client, TimeUuid, mapping: { Mapper } } = require('cassandra-driver');
const { Octokit } = require('@octokit/core');
const { default: axios } = require('axios');
const { v4 } = require('uuid');

const { USERNAME, PASSWORD, DATABASE = 'gitmeet' } = process.env;

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

  const createTable = `
    CREATE TYPE swipes (
      swipedBy text,
      liked boolean
    )

    CREATE TABLE IF NOT EXISTS ${DATABASE}.projects (
      id text,
      name text,
      author text,
      readme text,
      lat text,
      long text,
      tags list<text>,
      swipes list<swipes>,
      repo_id text,
      repo_link text,
      description text,
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
      message: `${DATABASE}.projects couldn't be created`
    });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.getProject = async (req, res) => {
  const projectID = req.params[0];

  if (req.method !== 'GET') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  try {
    const selectQuery = `SELECT 
    id, name, author, readme, location, tags, repo_id, repo_link FROM ${DATABASE}.projects WHERE id = ?`;
    const projectDetails = (await client.execute(selectQuery, [projectID], { prepare: true })).first();

    return res.json({ body: projectDetails });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: `Could not find project with ID ${projectID}` })
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.deleteProject = async (req, res) => {
  const projectID = req.params[0];

  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  try {
    const deleteQuery = `DELETE FROM ${DATABASE}.projects WHERE id = ?`;
    await client.execute(deleteQuery, [projectID], { prepare: true });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: `Could not find and delete a project with ID ${projectID}`});
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.editProject = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  const projectID = req.params[0];
  const projectMapper = mapper.forModel('Project');
  const { auth, user_id, username, reponame, lat, long } = req.body;

  if (!auth) return res.status(500).json({ message: 'Github auth token not provided '});
  if (!user_id) return res.status(500).json({ message: 'User ID not provided' });
  if (!reponame) return res.status(500).json({ message: 'Reponame not provided' });
  if (!username) return res.status(500).json({ message: 'Username not provided' });
  if (!location) return res.status(500).json({ message: 'Location not provided' });
  if (!projectID) return res.status(500).json({ message: 'Project ID not provided' });

  try {
    const ocotokit = new Octokit({ auth });
    const githubResponse = await ocotokit.request('GET /repos/{owner}/{repo}', {
      owner: username,
      repo: reponame
    });

    const { id, full_name, name, description, topics, default_branch, html_url, owner } = githubResponse;
    const { data: readme } = await axios.get(`https://raw.githubusercontent.com/${full_name}/${default_branch}/README.md`);

    await projectMapper.update({
      id: projectID, 
      lat,
      long,
      name,
      author: owner.login,
      readme,
      description,
      tags: topics,
      repo_id: id,
      repo_link: html_url,
    })

    return res.json({ message: 'Project has been refreshed successfully' });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: 'Access denied trying to access the repository in github' });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.createProject = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  const projectMapper = mapper.forModel('Project');
  const { auth, user_id, username, reponame, lat, long } = req.body;

  if (!auth) return res.status(500).json({ message: 'Github auth token not provided '});
  if (!user_id) return res.status(500).json({ message: 'User ID not provided' });
  if (!reponame) return res.status(500).json({ message: 'Reponame not provided' });
  if (!username) return res.status(500).json({ message: 'Username not provided' });
  if (!location) return res.status(500).json({ message: 'Location not provided' });

  try {
    const ocotokit = new Octokit({ auth });
    const githubResponse = await ocotokit.request('GET /repos/{owner}/{repo}', {
      owner: username,
      repo: reponame
    });

    const { id, full_name, name, description, topics, default_branch, html_url, owner } = githubResponse;
    const { data: readme } = await axios.get(`https://raw.githubusercontent.com/${full_name}/${default_branch}/README.md`);

    await projectMapper.insert({
      id: v4(), 
      lat,
      long,
      name,
      author: owner.login,
      readme,
      description,
      tags: topics,
      repo_id: id,
      repo_link: html_url,
    })

    return res.json({ message: 'Project has been added successfully' });
  } catch (_) {
    console.error(_);
    return res.status(404).json({ message: 'Access denied trying to access the repository in github' });
  }
};

/**
 * @param {import("express").Request} req HTTP request context.
 * @param {import("express").Response} res HTTP response context.
 */
exports.swipeProject = async (req, res) => {
  const projectID = req.params[0];
  const { liked , user_id } = req.body;

  const projectMapper = mapper.forModel('Project');

  if (req.method !== 'POST') {
    return res.status(404).json({ message: 'Requested method not found!' });
  }

  if (!liked) return res.status(404).json({ message: 'Liked status not specified' });
  if (!user_id) return res.status(404).json({ message: 'user_id not specified' });

  try {
    const countResult = await projectMapper.findAll({ id: projectID });
    if (countResult.length === 0) return res.status(404).json({ message: 'Project not found' });
  
    await projectMapper.update({
      id: projectID,
      swipes: [
        {
          swipedBy: user_id,
          liked
        }
      ]
    });

    return res.json({ message: 'Swipe has been saved successfully!'});
  } catch (_) {
    console.error(_);
    return res.status(500).json({ message: 'Something really unexpected happened. Is it all because of 2020?' });
  }
};
