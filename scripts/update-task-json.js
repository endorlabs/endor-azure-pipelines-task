const fs = require('fs');

console.log('Updating version in task/task.json file');

const version = process.argv[2];
if (!version.match(/[0-9]+\.[0-9]+\.[0-9]+/)) {
  console.log('Bad version input: ', version);
  process.exitCode = 1;
  process.exit();
}

const metaVersion = version.split('.');
const newVersion = {
  Major: metaVersion[0],
  Minor: metaVersion[1],
  Patch: metaVersion[2],
};

console.log('taskVersion: ', newVersion);

const filePath = './task/task.json';
const taskJSON_File = JSON.parse(fs.readFileSync(filePath, 'utf8'));
taskJSON_File['version'] = newVersion;
fs.writeFileSync(filePath, JSON.stringify(taskJSON_File, null, 2), 'utf8');
console.log('Version updated in task/task.json file, version: ', newVersion);