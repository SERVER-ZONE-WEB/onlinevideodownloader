const https = require('https');
const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = require('./package.json');

// Check for security vulnerabilities
console.log('Checking for security vulnerabilities...');

// Check npm audit
const { exec } = require('child_process');
exec('npm audit', (error, stdout, stderr) => {
    console.log('NPM Audit Results:');
    console.log(stdout);
});

// Check dependencies versions
console.log('\nChecking dependency versions...');
Object.entries(packageJson.dependencies).forEach(([pkg, version]) => {
    https.get(`https://registry.npmjs.org/${pkg}/latest`, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const latestVersion = JSON.parse(data).version;
                const currentVersion = version.replace('^', '');
                console.log(`${pkg}: Current ${currentVersion} | Latest ${latestVersion}`);
            } catch (e) {
                console.log(`Error checking ${pkg}: ${e.message}`);
            }
        });
    }).on('error', (e) => {
        console.error(`Error checking ${pkg}: ${e.message}`);
    });
});

// Basic security checks
console.log('\nPerforming basic security checks...');

// Check if .env exists
if (!fs.existsSync('.env')) {
    console.error('WARNING: .env file missing!');
}

// Check JWT secret
const envContent = fs.readFileSync('.env', 'utf8');
if (envContent.includes('your-secret')) {
    console.error('WARNING: Default JWT secret detected in .env');
}

// Check for sensitive files in git
const gitignore = fs.readFileSync('.gitignore', 'utf8');
const sensitiveFiles = ['.env', 'node_modules', '*.log'];
sensitiveFiles.forEach(file => {
    if (!gitignore.includes(file)) {
        console.error(`WARNING: ${file} should be in .gitignore`);
    }
});
