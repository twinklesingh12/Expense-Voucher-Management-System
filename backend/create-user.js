require('dotenv').config();
const bcrypt = require('bcryptjs');
const readline = require('readline');
const db = require('./db');

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer.trim()); }));
}

function askHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;
    if (!input.isTTY || typeof input.setRawMode !== 'function') {
      ask(question + ' (input may be visible in this terminal): ').then(resolve, reject);
      return;
    }
    output.write(question);
    let value = '';
    const onData = chunk => {
      const key = chunk.toString();
      if (key === '\u0003') { cleanup(); reject(new Error('Cancelled.')); return; }
      if (key === '\r' || key === '\n') { output.write('\n'); cleanup(); resolve(value); return; }
      if (key === '\u0008' || key === '\u007f') { value = value.slice(0, -1); return; }
      if (key >= ' ' && key !== '\u007f') value += key;
    };
    function cleanup() { input.removeListener('data', onData); input.setRawMode(false); input.pause(); }
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

async function main() {
  try {
    console.log('\nVoucherFlow — Create a local user account');
    console.log('This is a private terminal command, not a public registration page.');
    const fullName = await ask('Full name: ');
    const email = (await ask('Email: ')).toLowerCase();
    const role = (await ask('Role (employee/director/accounts): ')).toLowerCase();
    const department = await ask('Department (optional): ');
    if (!fullName || fullName.length > 120) throw new Error('Name is required and must be at most 120 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) throw new Error('Enter a valid email address (maximum 150 characters).');
    if (!['employee', 'director', 'accounts'].includes(role)) throw new Error('Role must be employee, director, or accounts.');
    if (department.length > 100) throw new Error('Department must be at most 100 characters.');
    const password = await askHidden('Password (at least 12 characters): ');
    const confirm = await askHidden('Confirm password: ');
    if (password.length < 12) throw new Error('Password must be at least 12 characters.');
    if (password !== confirm) throw new Error('Passwords do not match.');
    const passwordHash = await bcrypt.hash(password, 12);
    await db.execute(
      'INSERT INTO users (full_name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, passwordHash, role, department || null]
    );
    console.log(`\nCreated ${role} account for ${email}. You can now sign in through VoucherFlow.`);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') console.error('\nAn account with that email already exists. No existing account was changed.');
    else console.error(`\nAccount not created: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}
main();
