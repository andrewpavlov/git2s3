'use strict';

exports.handler = (event, context, callback) => {
    let repoName;
    let remoteUrl;

    try {
        repoName = event['body-json']['project']['path_with_namespace'];
    } catch(e) {
        repoName = event['body-json']['repository']['full_name'];
    }
    repoName = repoName.replace(/\//, '-');
    try {
        remoteUrl = event['body-json']['project']['git_ssh_url']
    } catch(e) {
        try {
            remoteUrl = 'git@' +
                event['body-json']['repository']['links']['html']['href']
                .replace(/https:\/\//, '')
                .replace(/\//, ':', 1) + '.git';
        } catch(e) {
            remoteUrl = event['body-json']['repository']['ssh_url']
        }
    }

    let opts = {
        repo: {
            url: remoteUrl,
            name: repoName,
            branch: event['context']['branch']
        },
        awsOptions: {
            region: process.env.AWS_REGION ? process.env.AWS_REGION : 'us-east-1'
        },
        KMS: {
            Bucket: event['context']['kms-bucket'],
            Key: event['context']['kms-key'],
            PublicKey: event['context']['public-key']
        },
        output: {
            name: event['context']['output-name'],
            Bucket: event['context']['output-bucket'],
            files: event['context']['output-files']
        }
    };

    require('./lib/index')(opts, () => {
        console.log('done');
        callback(null, 'Hello from Lambda');
    });
};
