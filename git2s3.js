'use strict';

const argv = require('yargs').argv;
const aws = require('./lib/aws');

let opts = {
    repo: {
        url: argv['repo-url'] || 'git@github.com:andrewpavlov/git2s3.git',
        name: argv['repo-name'] || 'git2s3',
        branch: argv['branch'] || 'master'
    },
    awsOptions: {
        profile: argv['profile'] || 'default',
        region: argv['region'] || 'us-east-1'
    }
};

// for some reasons instead of / we have in arguments \\
// so, fix this
opts.repo.url = opts.repo.url.replace(/\\/g, '/');

aws.config(opts.awsOptions);

let stackName = argv['stack-name'] || 'git2s3';
aws.getOuputs(stackName, (err, params) => {
    opts.KMS = {
        Bucket: params['KeyBucketName'],
        Key: 'enc_key',
        PublicKey: params['PublicSSHKey']
    };
    opts.output = {
        name: opts.repo.name,
        Bucket: params['OutputBucketName'],
        files: '**/*'
    };

    require('./lib/index')(opts, () => {
        console.log('Done.');
    });
});
