'use strict';

const fs = require('fs');
const archiver = require('archiver');
const zip = archiver('zip');
let outputFile = 'git2s3.zip';

let output = fs.createWriteStream(outputFile);
// listen for all archive data to be written
output.on('close', function () {
    console.log(zip.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
});

// pipe archive data to the file
zip.pipe(output);

// add files to zip
zip.directory('./lib');
zip.directory('./node_modules');
zip.file('./index.js');
zip.finalize();
