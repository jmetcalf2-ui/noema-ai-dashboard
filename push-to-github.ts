import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

// Get all files to push (excluding node_modules, .git, etc.)
function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    // Skip unwanted directories and files
    if (entry.name === 'node_modules' || 
        entry.name === '.git' || 
        entry.name === '.cache' ||
        entry.name === '.upm' ||
        entry.name === '.config' ||
        entry.name === '.local' ||
        entry.name === 'dist' ||
        entry.name.startsWith('.replit')) {
      continue;
    }
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function pushToGitHub() {
  const owner = 'jmetcalf2-ui';
  const repo = 'noema-ai-dashboard';
  
  console.log('Getting GitHub client...');
  const octokit = await getUncachableGitHubClient();
  
  console.log('Getting authenticated user...');
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.login}`);
  
  // Get the default branch
  let defaultBranch = 'main';
  let currentCommitSha: string | null = null;
  let treeSha: string | null = null;
  
  try {
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    defaultBranch = repoData.default_branch;
    console.log(`Default branch: ${defaultBranch}`);
    
    // Get the current commit SHA
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    });
    currentCommitSha = refData.object.sha;
    
    const { data: commitData } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: currentCommitSha
    });
    treeSha = commitData.tree.sha;
    console.log(`Current commit: ${currentCommitSha}`);
  } catch (e: any) {
    if (e.status === 404) {
      console.log('Repository is empty, will create initial commit');
    } else {
      throw e;
    }
  }
  
  // Get all files
  const workDir = '/home/runner/workspace';
  console.log('Collecting files...');
  const files = getAllFiles(workDir);
  console.log(`Found ${files.length} files to push`);
  
  // Create blobs for all files
  console.log('Creating blobs...');
  const treeItems: any[] = [];
  
  for (const file of files) {
    const fullPath = path.join(workDir, file);
    let content: string;
    let encoding: 'utf-8' | 'base64' = 'utf-8';
    
    try {
      // Try to read as text first
      content = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      // If that fails, read as base64
      content = fs.readFileSync(fullPath).toString('base64');
      encoding = 'base64';
    }
    
    try {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content,
        encoding
      });
      
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    } catch (e: any) {
      console.log(`Skipping ${file}: ${e.message}`);
    }
  }
  
  console.log(`Created ${treeItems.length} blobs`);
  
  // Create a new tree
  console.log('Creating tree...');
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
    base_tree: treeSha || undefined
  });
  
  // Create a new commit
  console.log('Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Push from Replit: Noema Research AI Dashboard with Excel support',
    tree: newTree.sha,
    parents: currentCommitSha ? [currentCommitSha] : []
  });
  
  // Update the reference
  console.log('Updating reference...');
  if (currentCommitSha) {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.sha
    });
  } else {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${defaultBranch}`,
      sha: newCommit.sha
    });
  }
  
  console.log(`Successfully pushed to ${owner}/${repo}!`);
  console.log(`Commit SHA: ${newCommit.sha}`);
}

pushToGitHub().catch(console.error);
