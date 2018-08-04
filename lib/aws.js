'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');

exports.config = config;
exports.getKeys = getKeys;
exports.getOuputs = getOuputs;
exports.upload = upload;

AWS.config.apiVersions = {
    cloudformation: '2010-05-15',
    // other service API versions
};

///////////////////////////

function config(opts) {
    if (opts.profile) {
        var credentials = new AWS.SharedIniFileCredentials({
            profile: opts.profile
        });
        AWS.config.update({
            credentials: credentials
        });
    }

    if (opts.region) {
        AWS.config.update({
            region: opts.region
        });
    }
}

function getKeys(opts, cb) {
    const kms = new AWS.KMS();
    const s3 = new AWS.S3();
    s3.getObject({
        Bucket: opts.Bucket,
        Key: opts.Key
    }, (err, data) => {
        let params = {
            CiphertextBlob: data['Body']
        };
        kms.decrypt(params, (err, data) => {
            let privkey = data['Plaintext'];
            let pubkey = opts.PublicKey;
            fs.writeFile('/tmp/id_rsa', privkey, (err) => {
                fs.writeFile('/tmp/id_rsa.pub', pubkey, (err) => {
                    cb();
                });
            });
        });
    });
}

function getOuputs(stackName, cb) {
    const cloudformation = new AWS.CloudFormation();
    cloudformation.describeStacks({
        StackName: stackName
    }, (err, data) => {
        if (err) {
            return cb(err);
        }
        let outputs = {};
        data.Stacks[0].Outputs.map(function (_o) {
            outputs[_o.OutputKey] = _o.OutputValue;
        });
        return cb(null, outputs);
    });
}

function upload(opts, cb) {
    const outputName = opts.output.name;
    const fileName = outputName + '.zip';
    const filePath = '/tmp/' + fileName;
    console.log(opts.output);
    putObject({
        Bucket: opts.output.Bucket,
        Key: outputName + '/' + opts.repo.hash,
        Body: JSON.stringify(opts.repo)
    })
    .then(r => {
        return putObject({
            Bucket: opts.output.Bucket,
            Key: fileName,
            Body: fs.createReadStream(filePath),
            Tagging: 'reference=' + opts.repo.hash +
                '&version=' + r.VersionId
        });
    })
    .then(r => {
        cb(null, r);
    })
    .catch(e => {
        cb(e, null);
    });
}

function putObject(params) {
    new Promise((resolve, reject) => {
        const s3 = new AWS.S3();
        s3.putObject(params, (err, data) => {
            if (err) {
                return reject(err);
            }
            resolve(data);
        });
    });
}