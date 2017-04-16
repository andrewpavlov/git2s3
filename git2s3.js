'use strict';

const argv = require('yargs').argv;
const utils = require('js.shared').utils;
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

aws.config(opts.awsOptions);

let stackName = argv['stack-name'];
aws.getOuputs(stackName, (err, params) => {
    opts.KMS = {
        Bucket: params['KeyBucketName'],
        Key: 'enc_key',
        PublicKey: params['PublicSSHKey']
    };
    opts.output = {
        name: opts.repo.name,
        Bucket: params['OutputBucketName'],
        files: utils.get(params, 'OutputFiles')
    };

    require('./lib/index')(opts, () => {
        console.log('Done.');
    });
});
