'use strict';

const fs = require('fs');
const archiver = require('archiver');
const zip = archiver('zip');

exports.archive = archive;

// good practice to catch this error explicitly
zip.on('error', function (err) {
    throw err;
});

///////////////////////////

function archive(opts, cb) {
    let repoName = opts.repo.name;
    let outputFile = '/tmp/' + opts.output.name + '.zip';
    let inputs = opts.output.files || '**/*';

    let output = fs.createWriteStream(outputFile);
    // listen for all archive data to be written
    output.on('close', function () {
        console.log(zip.pointer() + ' total bytes');
        console.log('archiver has been finalized and the output file descriptor has closed.');
        cb(outputFile);
    });

    // pipe archive data to the file
    zip.pipe(output);

    // add files to zip
    zip.glob(inputs, {
        cwd: '/tmp/' + repoName + '/',
        dot: true,
        ignore: ['.git/**']
    });
    zip.finalize();
}
