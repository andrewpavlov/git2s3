'use strict';

const fs = require('fs');
const aws = require('./aws');
const NodeGit = require('nodegit');

exports.load = load;

///////////////////////////

function load(opts, cb) {
    aws.config(opts.awsOptions);
    aws.getKeys(opts['KMS'], () => {
        let dest = '/tmp/' + opts.repo.name;
        let fetchOpts = fetchOptions();
        let repository;
        if (fs.existsSync(dest)) {
            // pull
            let Checkout = NodeGit.Checkout;
            NodeGit.Repository
                .open(dest)
                .then((repo) => {
                    repository = repo;
                    return repository.fetchAll(fetchOpts);
                })
                .then(() => {
                    return repository.getBranch('refs/remotes/origin/' + opts.repo.branch)
                })
                .then((reference) => {
                    return repository.checkoutRef(reference);
                })
                .catch((err) => {
                    console.error('Pull error:', err);
                })
                .done(() => {
                    console.log('Git pull finished');
                    cb(dest);
                });
        } else {
            // clone
            NodeGit
                .Clone(opts.repo.url, dest, {
                    fetchOpts: fetchOpts
                })
                .then((repo) => {
                    repository = repo;
                    return repository.getBranch('refs/remotes/origin/' + opts.repo.branch)
                })
                .then((reference) => {
                    return repository.checkoutRef(reference);
                })
                .then(() => {
                    console.log('Git clone finished');
                    cb(dest);
                })
                .catch((err) => {
                    console.error(err);
                });
        }
    });
}

function fetchOptions() {
    return {
        callbacks: {
            credentials: function (url, userName) {
                return NodeGit.Cred.sshKeyNew(userName, '/tmp/id_rsa.pub', '/tmp/id_rsa', '');
            },
            certificateCheck: function () {
                return 1;
            }
        }
    }
}
