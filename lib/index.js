'use strict';

const git = require('./git');
const zip = require('./zip');
const aws = require('./aws');

module.exports = function (opts, cb) {
    git.load(opts, (path) => {
        console.log('git.load: ', path);
        zip.archive(opts, (file) => {
            console.log('zip.archive:', file);
            aws.upload(opts, (err, data) => {
                if (err) {
                    console.log('ERR aws.upload:', err);
                }
                cb();
            });
        });
    });
};
