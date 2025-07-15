#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`❌ Error executing: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function showRecentCommits() {
  console.log('\n📋 Recent commits:');
  const commits = exec('git log --oneline -10');
  console.log(commits);
}

function showCurrentStatus() {
  console.log('\n📊 Current status:');
  console.log('Branch:', exec('git branch --show-current'));
  console.log('Last commit:', exec('git log -1 --oneline'));
  console.log('Remote status:', exec('git status -s'));
}

function rollbackToCommit(commitHash) {
  console.log(`\n🔄 Rolling back to commit: ${commitHash}`);
  
  // Create backup tag
  const backupTag = `backup-before-rollback-${Date.now()}`;
  exec(`git tag ${backupTag}`);
  console.log(`✅ Created backup tag: ${backupTag}`);
  
  // Reset to commit
  exec(`git reset --hard ${commitHash}`);
  console.log(`✅ Reset to commit: ${commitHash}`);
  
  // Force push (dangerous, but needed for rollback)
  rl.question('\n⚠️  This will force push and overwrite remote history. Are you sure? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      exec('git push --force-with-lease');
      console.log('✅ Force pushed to remote');
      console.log('\n🎉 Rollback completed!');
      console.log(`💾 Backup tag created: ${backupTag}`);
      console.log('🔄 Cloudflare will automatically redeploy from the rolled-back code');
    } else {
      console.log('❌ Rollback cancelled');
    }
    rl.close();
  });
}

function main() {
  console.log('🚀 SVTR.AI Rollback Tool');
  console.log('========================');
  
  showCurrentStatus();
  showRecentCommits();
  
  rl.question('\n🔄 Enter commit hash to rollback to (or "q" to quit): ', (input) => {
    if (input.toLowerCase() === 'q') {
      console.log('👋 Goodbye!');
      rl.close();
      return;
    }
    
    if (input.match(/^[a-f0-9]{7,40}$/)) {
      rollbackToCommit(input);
    } else {
      console.log('❌ Invalid commit hash format');
      rl.close();
    }
  });
}

main();