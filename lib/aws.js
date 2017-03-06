'use strict';

const fs = require('fs');
const AWS = require('aws-sdk');

exports.config = config;
exports.getKeys = getKeys;
exports.upload = upload;

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

    AWS.config.update({
        region: opts.region
    });
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

function upload(opts, cb) {
    const s3 = new AWS.S3();
    const fileName = opts.output.name + '.zip';
    const filePath = '/tmp/' + fileName;
    console.log(opts.output);
    s3.putObject({
        Bucket: opts.output.Bucket,
        Key: fileName,
        Body: fs.createReadStream(filePath)
    }, (err, data) => {
        cb(err, data);
    });
}
