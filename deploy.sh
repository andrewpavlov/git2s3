#!/bin/bash

set -e

## Check arguments

while [[ $# -gt 1 ]]
do
key="$1"

case $key in
    -b|--bucket-name)
    bucketname="$2"
    shift # past argument
    ;;
    -n|--stack-name)
    stackname="$2"
    shift # past argument
    ;;
    -ip|--allowed-ips)
    allowedips="$2"
    shift # past argument
    ;;
    -s|--secret)
    apisecret="$2"
    shift # past argument
    ;;
    -p|--profile)
    profile="$2"
    shift # past argument
    ;;
    -r|--region)
    region="$2"
    shift # past argument
    ;;
    --clean)
    clean=yes
    ;;
    *)
            # unknown option
    ;;
esac
shift # past argument or value
done

## Define

# generating random suffix
random=$(cat /dev/urandom | tr -dc "a-z0-9" | fold -w 8 | head -n 1)
apisecretdef=$(cat /dev/urandom | tr -dc "a-zA-Z0-9" | fold -w 32 | head -n 1)

if [ -z "$stackname" ]; then
    read -p "Cloud Formation stack name [git2s3-$random-cf]: " stackname
    stackname=${stackname:-git2s3-$random-cf}
fi
if [ -z "$profile" ]; then
    defprofile=""
    read -p "AWS Profile: " profile
    profile=${profile:-$defprofile}
fi
if [ -z "$region" ]; then
    defregion="us-east-1"
    read -p "AWS Region [$defregion]: " region
    region=${region:-$defregion}
fi

aws_options=""

if [ $profile ]; then
    aws_options="$aws_options --profile $profile"
fi;
if [ $region ]; then
    aws_options="$aws_options --region $region"
fi;

if [ $clean ]; then
    set +e #ignore all errors

    lambdabucket=`aws cloudformation describe-stacks \
        --stack-name $stackname \
        $aws_options \
        --query "Stacks[0].Outputs[?OutputKey =='OutputBucketName'].[OutputValue]" \
        --output text`

    echo -e
    echo "-- Remove bucket"
    cmd="aws s3 rb s3://$lambdabucket $aws_options --force"
    $cmd
    echo "done"

    keybucket=`aws cloudformation describe-stacks \
        --stack-name $stackname \
        $aws_options \
        --query "Stacks[0].Outputs[?OutputKey =='KeyBucketName'].[OutputValue]" \
        --output text`

    echo -e
    echo "-- Remove key bucket"
    cmd="aws s3 rb s3://$keybucket $aws_options --force"
    $cmd
    echo "done"

    echo -e
    echo "-- Deleting cloudformation stack"
    cmd="aws cloudformation delete-stack \
     --stack-name $stackname \
     $aws_options"
    $cmd

    cmd="aws cloudformation wait stack-delete-complete \
     --stack-name $stackname \
     $aws_options"
    $cmd

    echo -e
    echo "All done!"

    exit;
fi;

## Variables required for creation

if [ -z "$bucketname" ]; then
    read -p "Lambda bucket [git2s3-$random-content]: " bucketname
    bucketname=${bucketname:-git2s3-$random-content}
fi
if [ -z "$allowedips" ]; then
    read -p "Allowed IPs [0.0.0.0/0]: " allowedips
    allowedips=${allowedips:-0.0.0.0/0}
fi
if [ -z "$apisecret" ]; then
    read -p "Secret [$apisecretdef]: " apisecret
    apisecret=${apisecret:-$apisecretdef}
fi

## Run commands

echo -e
echo "-- Installing packages"
cmd="npm install --production"
echo $cmd
$cmd
echo "done"

echo -e
echo "-- Build Lambda"
cmd="node install.js"
echo $cmd
$cmd
echo "done"

echo -e
echo "-- Creating bucket"
cmd="aws s3 mb s3://$bucketname $aws_options"
echo $cmd
$cmd
echo "done"

echo -e
echo "-- Uploading lambda"
cmd="aws s3 cp git2s3.zip s3://$bucketname $aws_options"
echo $cmd
$cmd
echo "done"

echo -e
echo "-- Creating cloudformation stack"
cmd="aws cloudformation create-stack \
 --stack-name $stackname \
 --template-body file://git2s3-cloudformation.yml \
 --capabilities CAPABILITY_NAMED_IAM \
 --parameters \
 ParameterKey=Git2S3Bucket,ParameterValue=$bucketname \
 ParameterKey=AllowedIps,ParameterValue=$allowedips \
 ParameterKey=ApiSecret,ParameterValue=$apisecret \
 $aws_options"
echo $cmd
$cmd

cmd="aws cloudformation wait stack-create-complete \
 --stack-name $stackname \
 $aws_options"
echo $cmd
$cmd

echo -e
echo "All done!"
echo -e
echo "-- Outputs"

# maybe it is known issue,
# but for some reasons describe-stacks returns nothing directly after
# stack-create-complete

cmd="aws cloudformation describe-stacks \
 --stack-name $stackname \
 $aws_options \
 --query \"Stacks[0].Outputs\" \
 --output text"
echo $cmd
$cmd
