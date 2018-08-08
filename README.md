# Git 2 S3

This package extends existing AWS solution

## Using

```
aws cloudformation create-stack --stack-name $GIT2S3_STACK_NAME --template-body file://cf/git2s3-install.yml --capabilities CAPABILITY_NAMED_IAM --profile $AWS_PROFILE --region $AWS_REGION
```

Check all available parameters inside ./cf/git2s3-install.yml cloudformation file

Stage variables:
- 'Branches' - Branches you would like to follow  (comma separated list, e.g. develop,master)
- 'AllowedIPs' - Allowed IPs. Comma seperated list of IP CIDR blocks for source IP authentication.
    (e.g. The BitBucket Cloud IP ranges: '131.103.20.160/27,165.254.145.0/26,104.192.143.0/24')


## Collaborators

```
aws cloudformation update-stack --stack-name $GIT2S3_PIPELINE_NAME --template-body file://cf/project-pipeline.yml --parameters ParameterKey=OAuthToken,ParameterValue=$GITHUB_OATH_TOKEN ParameterKey=OutputBucket,ParameterValue=$GIT2S3_DEST_BUCKET --capabilities CAPABILITY_NAMED_IAM --profile $AWS_PROFILE --region $AWS_REGION
```

Check all available parameters inside ./cf/project-pipeline.yml stack
