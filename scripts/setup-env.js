const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise((res) => rl.question(q, res));

async function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

async function main() {
  console.log('\n=== Judith Seafoods Environment Setup ===\n');

  if (fs.existsSync('.env.local')) {
    const answer = await question('.env.local already exists. Overwrite? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      rl.close();
      return;
    }
  }

  console.log('\nEnter your MongoDB Atlas connection string:');
  console.log('(Format: mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0)\n');
  const mongodbUri = await question('MongoDB URI: ');

  console.log('\nEnter your application URL (e.g., http://localhost:3000 or https://yourdomain.com):\n');
  const nextAuthUrl = await question('NEXTAUTH_URL: ');

  const nextAuthSecret = await generateSecret();

  console.log('\nEnter your public app URL:\n');
  const publicAppUrl = await question('NEXT_PUBLIC_APP_URL: ');

  const envContent = `MONGODB_URI=${mongodbUri}
NEXTAUTH_URL=${nextAuthUrl}
NEXTAUTH_SECRET=${nextAuthSecret}
NEXT_PUBLIC_APP_URL=${publicAppUrl}
`;

  fs.writeFileSync('.env.local', envContent);

  console.log('\n✅ Created .env.local with the following content:\n');
  console.log(envContent);
  console.log('\n⚠️  IMPORTANT: Add .env.local to your hosting provider\'s environment variables!');
  console.log('   Never commit .env.local to version control.\n');

  rl.close();
}

main();
