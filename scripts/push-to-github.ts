import { getUncachableGitHubClient } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const REPO_OWNER = 'jmetcalf2-ui';
const REPO_NAME = 'noema-ai-dashboard';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.replit',
  '.cache',
  '.config',
  'dist',
  '.upm',
  'replit.nix',
  'scripts/push-to-github.ts',
  'scripts/create-github-repo.ts',
  '.breakpoints',
  'generated-icon.png',
  'package-lock.json',
  'attached_assets'
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function pushFiles() {
  const octokit = await getUncachableGitHubClient();
  const baseDir = process.cwd();
  const files = getAllFiles(baseDir);
  
  console.log(`Found ${files.length} files to push`);

  console.log('Creating initial README to initialize repo...');
  try {
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'README.md',
      message: 'Initial commit',
      content: Buffer.from('# Noema AI Dashboard\n\nAI-powered data analysis platform that transforms spreadsheets into actionable intelligence.\n').toString('base64'),
    });
  } catch (e) {
    console.log('README already exists, continuing...');
  }

  let mainRef;
  try {
    mainRef = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
  } catch {
    console.log('Trying master branch...');
    mainRef = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: 'heads/master',
    });
  }

  const baseCommitSha = mainRef.data.object.sha;
  console.log(`Base commit: ${baseCommitSha}`);

  const baseTree = await octokit.git.getCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    commit_sha: baseCommitSha,
  });

  const blobs: { path: string; sha: string; mode: '100644'; type: 'blob' }[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(baseDir, file));
      const base64Content = content.toString('base64');
      
      const blob = await octokit.git.createBlob({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        content: base64Content,
        encoding: 'base64',
      });
      
      blobs.push({
        path: file,
        sha: blob.data.sha,
        mode: '100644',
        type: 'blob',
      });
      
      console.log(`Created blob for: ${file}`);
    } catch (error: any) {
      console.error(`Error creating blob for ${file}:`, error.message);
    }
  }
  
  console.log('Creating tree...');
  const tree = await octokit.git.createTree({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    base_tree: baseTree.data.tree.sha,
    tree: blobs,
  });
  
  console.log('Creating commit...');
  const commit = await octokit.git.createCommit({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    message: 'Add all project files: Noema AI Dashboard',
    tree: tree.data.sha,
    parents: [baseCommitSha],
  });
  
  console.log('Updating main branch...');
  await octokit.git.updateRef({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    ref: 'heads/main',
    sha: commit.data.sha,
  });
  
  console.log('\nDone! Files pushed to GitHub.');
  console.log(`View at: https://github.com/${REPO_OWNER}/${REPO_NAME}`);
}

pushFiles().catch(console.error);
