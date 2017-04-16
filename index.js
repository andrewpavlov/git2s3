'use strict';

const utils = require('js.shared').utils;
const aws = require('./lib/aws');

exports.handler = (event, context, callback) => {
    let stackName = utils.get(event, 'stageVariables.StackName');
    aws.getOuputs(stackName, (err, params) => {
        let body = JSON.parse(event.body);
        let opts = lambdaGetOpts(body, params);
        console.log('Options', opts);

        require('./lib/index')(opts, () => {
            callback(null, {
                statusCode: 200,
                body: ''
            });
        });
    });
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
        utils.get(data, 'push.changes.new.links.self'); // bitbucket
    let branch = ref.split('/')[-1];
    // TODO: if not in list - skip

    return {
        repo: {
            url: remoteUrl,
            name: repoName,
            branch: utils.get(params, 'Branch')
        },
        awsOptions: {
            region: process.env.AWS_REGION ? process.env.AWS_REGION : 'us-east-1'
        },
        KMS: {
            Bucket: params['KeyBucketName'],
            Key: 'enc_key',
            PublicKey: params['PublicSSHKey']
        },
        output: {
            name: repoName,
            Bucket: params['OutputBucketName'],
            files: utils.get(params, 'OutputFiles')
        }
    };
}
