'use strict';

const utils = require('js.shared').utils;

exports.handler = (event, context, callback) => {
    let skip = false;
    let body = JSON.parse(event.body);
    let opts = lambdaGetOpts(body, event);

    if (!opts) {
        skip = true;
    }

    // check ip
    let allowedIPs = utils.get(event, 'allowedIPs');
    if (!skip && !utils.empty(allowedIPs)) {
        // TODO: skip if ip filter
    }

    // check secret
    let apiSecret = utils.get(event, 'apiSecret');
    if (!skip && !utils.empty(apiSecret)) {
        // TODO: check if right secret word
    }

    // check branch
    let branches = utils.get(event, 'branches');
    if (!skip && !utils.empty(branches)) {
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
        utils.get(data, 'repository.full_name') || // bitbucket, github
        utils.get(data, 'project.path_with_namespace'); // gitlab
    let repoName = repoFullName.replace(/\//, '-');

    // Head commit hash
    let hash = utils.get(data, 'after') || // github, gitlab
        utils.get(data, 'push.changes.0.new.target.hash'); // bitbucket

    // Url to repo
    let remoteUrl = utils.get(data, 'repository.ssh_url') || // github
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
    let ref = utils.get(data, 'ref') || // github, gitlab
        utils.get(data, 'push.changes.0.new.links.html.href'); // bitbucket
    
    if (!ref) {
        // not push request
        return null;
    }

    let branch = ref.split('/');
    branch = branch[branch.length - 1];
    repoFullName = repoName + '-' + branch;

    // What'a new
    let commits = [];
    if (utils.get(data, 'commits')) {
        // github, gitlab
        utils.get(data, 'commits', []).forEach(c => {
            commits.push({
                hash: utils.get(c, 'id'),
                url: utils.get(c, 'url'),
                message: utils.trim(utils.get(c, 'message')),
                timestamp: utils.get(c, 'timestamp'),
                author: [
                    utils.get(c, 'author.name'),
                    '<' + utils.get(c, 'author.email', '') + '>'
                ].join(' ')
            });
        });
    } else if (utils.get(data, 'push.changes')) {
        // bitbucket
        utils.get(data, 'push.changes.0.commits', []).forEach(c => {
            commits.push({
                hash: utils.get(c, 'hash'),
                url: utils.get(c, 'links.html.href'),
                message: utils.trim(utils.get(c, 'summary.raw')),
                timestamp: utils.get(c, 'date'),
                author: utils.get(c, 'author.raw')
            });
        });
    }

    return {
        repo: {
            hash: hash,
            url: remoteUrl,
            name: repoName,
            branch: branch,
            commits: commits
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
