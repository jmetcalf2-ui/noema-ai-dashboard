import { createRepository, getAuthenticatedUser } from '../server/github';

async function main() {
  try {
    console.log('Getting authenticated user...');
    const user = await getAuthenticatedUser();
    console.log(`Authenticated as: ${user.login}`);

    console.log('Creating repository...');
    const repo = await createRepository(
      'noema-ai-dashboard',
      'AI-powered data analysis platform that transforms spreadsheets into actionable intelligence',
      false
    );
    
    console.log(`Repository created: ${repo.html_url}`);
    console.log(`Clone URL: ${repo.clone_url}`);
    console.log(`SSH URL: ${repo.ssh_url}`);
    
    return repo;
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
