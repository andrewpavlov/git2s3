'use strict';

const utils = require('js.shared').utils;
const aws = require('./lib/aws');

exports.handler = (event, context, callback) => {
    console.log('start...', event);

    let body = JSON.parse(event.body);
    let opts = lambdaGetOpts(body, event);
    console.log('Options', opts);

    let branches = utils.get(event, 'branches');
    let skip = false;
    if (!utils.empty(branches)) {
        branches = branches.split(/[ \,\;]/);
        let branch = opts.repo.branch;
        skip = branches.indexOf(branch) === -1;
    }

    if (skip) {
        callback(null, {
            statusCode: 200,
            body: ''
        });
    } else {
        require('./lib/index')(opts, () => {
            callback(null, {
                statusCode: 200,
                body: ''
            });
        });
    }
};

function lambdaGetOpts(data, params) {
    // Repo name
    let repoFullName =
        utils.get(data, 'repository.full_name') // bitbucket, github
        ||
        utils.get(data, 'project.path_with_namespace'); // gitlab
    let repoName = repoFullName.replace(/\//, '-');

    // Url to repo
    let remoteUrl =
        utils.get(data, 'repository.ssh_url') // github
        ||
        utils.get(data, 'project.git_ssh_url'); // gitlab
    if (!remoteUrl) {
        // bitbucket
        remoteUrl = utils.get(data, 'repository.links.html.href', '');
        remoteUrl = remoteUrl
                .replace(/https:\/\//, '')
                .replace(/\//, ':', 1) + '.git';
        remoteUrl = 'git@' + remoteUrl;
    }

    // Getting updated branch
    let ref =
        utils.get(data, 'ref') // github, gitlab
        ||
        utils.get(data, 'push.changes.0.new.links.html.href'); // bitbucket

    let branch = ref.split('/');
    branch = branch[branch.length - 1];
    repoFullName = repoName + '-' + branch;

    return {
        repo: {
            url: remoteUrl,
            name: repoName,
            branch: branch
        },
        awsOptions: {
            region: process.env.AWS_REGION ? process.env.AWS_REGION : 'us-east-1'
        },
        KMS: {
            Bucket: params['keyBucket'],
            Key: 'enc_key',
            PublicKey: params['publicSSHKey']
        },
        output: {
            name: repoFullName,
            Bucket: params['outputBucket'],
            files: utils.get(params, 'outputFiles')
        }
    };
}
