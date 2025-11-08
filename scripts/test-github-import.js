const API_URL = 'http://localhost:3000/api/github/import';

// Test configuration
const TEST_USERNAME = 'shaedrich'; // Replace with actual GitHub username
const TEST_USER_ID = 'cmhi6nmxk0000oaap9cge82q7'; // User ID from check-profile-data

async function testGitHubImport() {
  console.log('=== TESTING GITHUB IMPORT ===\n');
  console.log(`Username: ${TEST_USERNAME}`);
  console.log(`User ID: ${TEST_USER_ID}\n`);

  try {
    console.log('Sending import request...');
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: TEST_USERNAME,
        userId: TEST_USER_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Import failed');
      console.error('Status:', response.status);
      console.error('Error:', data.error);
      return;
    }

    console.log('✅ Import successful!\n');
    console.log('Results:');
    console.log(`  📦 Projects added: ${data.projectsAdded}`);
    console.log(`  🔧 Skills added: ${data.skillsAdded}`);
    console.log(`  🧠 Embeddings created: ${data.embeddingsCreated}\n`);

    if (data.projects && data.projects.length > 0) {
      console.log('Projects imported:');
      data.projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name}`);
        console.log(`     ${project.url}`);
      });
    }

    console.log('\n✅ TEST PASSED');
    console.log('\nNext steps:');
    console.log('1. Run: node scripts/check-profile-data.js');
    console.log('2. Verify new experiences with company="GitHub"');
    console.log('3. Verify new skills and embeddings');
  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Development server is running (npm run dev)');
    console.error('2. Database is accessible');
    console.error('3. OPENAI_API_KEY is set');
  }
}

// Run test
testGitHubImport();
