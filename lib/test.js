'use strict';

const argv = require('yargs').argv;

let opts = {
    repo: {
        url: argv['repo-url'], //'git@github.com:andrewpavlov/git2s3.git'
        name: argv['repo-name'], //'git2s3'
        branch: argv['branch'] // 'master'
    },
    awsOptions: {
        profile: argv['aws-profile'] || 'default',
        region: argv['aws-region'] || 'us-east-1'
    },
    KMS: {
        Bucket: argv['kms-bucket'], // 'git2s3.keybucket'
        Key: argv['kms-key'], // 'enc_key'
        PublicKey: argv['public-key'] // 'ssh-rsa .....'
    },
    output: {
        name: argv['output-name'], // 'git2s3'
        Bucket: argv['output-bucket'], // 'git2s3.sources'
        files: argv['output-fiels'] || [
            '**/*'
        ]
    }
};

require('./index')(opts);
