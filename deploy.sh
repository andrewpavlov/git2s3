#!/bin/bash

######################################
## functions
function runcmd {
    local aws_options="--region ${region} --profile ${profile}"
    local cmd=$1" ${aws_options}"
    
    echo $cmd
    if [[ !$demo ]]; then
        $cmd
    fi
}

function stack_status {
    local stackname=$1

    local status=`aws cloudformation describe-stacks \
    --stack-name ${stackname} \
    ${aws_options} \
    | sed -n 's/[^\0]*StackStatus": "\([^"]*\)[^\0]*/\1/p'`
    echo $status
}

function create_stack {
    local stackname=$1
    local template=$2
    local extra=$3
    local capabilities=$4
    local shouldwait=$5
    local cmd="aws cloudformation create-stack \
        --stack-name ${stackname} \
        --template-body ${template} \
        ${extra}"
    if [ $capabilities ]; then
        cmd=$cmd" --capabilities CAPABILITY_NAMED_IAM"
    fi
    
    runcmd "${cmd}"
    if [ $shouldwait ]; then
        runcmd "aws cloudformation wait stack-create-complete --stack-name ${stackname}"
    fi
    echo "done"
}

function delete_stack {
    local stackname=$1
    local shouldwait=$2
    local cmd="aws cloudformation delete-stack --stack-name ${stackname}"

    runcmd "${cmd}"
    if [ $shouldwait ]; then
        runcmd "aws cloudformation wait stack-delete-complete --stack-name ${stackname}"
    fi
    echo "done"
}

function import_value {
    local stackname=$1
    local value=$2
    local aws_options="--region ${region} --profile ${profile}"
    local ret=`aws cloudformation describe-stacks \
        --stack-name ${stackname} \
        --query "Stacks[0].Outputs[?OutputKey =='${value}'].[OutputValue]" \
        --output text \
        ${aws_options}`
    echo $ret
}

function resource_value {
    local stackname=$1
    local value=$2
    local aws_options="--region ${region} --profile ${profile}"
    local ret=`aws cloudformation describe-stack-resources \
        --stack-name ${stackname} \
        --query "StackResources[?LogicalResourceId =='${value}'].PhysicalResourceId" \
        --output text \
        ${aws_options}`
    echo $ret
}
## functions
######################################

set -e

## Check arguments

while [[ $# -gt 0 ]]
do
key="$1"
case $key in
    -sb|--sources-bucket)
    sourcesbucket="$2"
    shift # past argument
    shift # past value
    ;;
    -n|--stack-name)
    stackname="$2"
    shift # past argument
    shift # past value
    ;;
    -s|--secret)
    apisecret="$2"
    shift # past argument
    shift # past value
    ;;
    -p|--profile)
    profile="$2"
    shift # past argument
    shift # past value
    ;;
    -m|--max-memory)
    memory="$2"
    shift # past argument
    shift # past value
    ;;
    -r|--region)
    region="$2"
    shift # past argument
    shift # past value
    ;;
    --clean)
    clean=true
    shift # past argument
    ;;
    --demo)
    demo=true
    shift # past argument
    ;;
    *)
    shift # unknown option - next
    ;;
esac
done

## Define

# generating random suffix
# random=$(cat /dev/urandom | tr -dc "a-z0-9" | fold -w 8 | head -n 1)
random=$(LC_ALL=C; cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 32 | head -n 1)
apisecretdef=$(LC_ALL=C; cat /dev/urandom | tr -dc 'a-z0-9' | fold -w 32 | head -n 1)

if [ -z "$stackname" ]; then
    read -p "Cloud Formation stack name [git2s3-$random-cf]: " stackname
    stackname=${stackname:-git2s3-$random-cf}
fi
if [ -z "$profile" ]; then
    defprofile="default"
    read -p "AWS Profile [$defprofile]: " profile
    profile=${profile:-$defprofile}
fi
if [ -z "$region" ]; then
    defregion="us-east-1"
    read -p "AWS Region [$defregion]: " region
    region=${region:-$defregion}
fi

aws_options=""
build_stackname="git2s3-codebuild"

if [ $profile ]; then
    aws_options="$aws_options --profile $profile"
fi;
if [ $region ]; then
    aws_options="$aws_options --region $region"
fi;

######################################
## clean
if [ $clean ]; then
    set +e #ignore all errors

    keybucket=`resource_value $stackname "KeyBucket"`
    if [ ! -z "$keybucket" ]; then
        echo -e
        echo "-- Remove key bucket"
        runcmd "aws s3 rb s3://$keybucket --force"
        echo "done"
    fi

    # delete git2s3 output bucket
    sourcesbucket=`resource_value $stackname "OutputBucket"`
    if [ ! -z "$sourcebucket" ]; then
        echo -e
        echo "-- Remove bucket with git sources"
        runcmd "aws s3 rb s3://$sourcesbucket $aws_options --force"
        echo "done"
    fi

    # delete build output bucket
    git2s3bucket=`resource_value $build_stackname "OutputBucket"`
    if [ ! -z "$git2s3bucket" ]; then
        echo -e
        echo "-- Remove git2s3 build output bucket"
        runcmd "aws s3 rm s3://$git2s3bucket --recursive"
        echo "done"
    fi

    # delete git2s3 stacks
    stack_exists=`stack_status $stackname`
    if [ ! -z "$stack_exists" ]; then
        echo -e
        echo "-- Deleting cloudformation stack"
        delete_stack $stackname true
    fi

    # delete build stacks
    build_stack_exists=`stack_status $build_stackname`
    if [ ! -z "$build_stack_exists" ]; then
        echo -e
        echo "-- Deleting build stack"
        delete_stack $build_stackname true
    fi

    echo -e
    echo "All done!"

    exit;
fi;
## clean
######################################

## Variables required for creation

if [ -z "$sourcesbucket" ]; then
    read -p "Bucket for sources [auto generated]: " sourcesbucket
    sourcesbucket=${sourcesbucket:-}
fi
if [ -z "$apisecret" ]; then
    read -p "Secret [$apisecretdef]: " apisecret
    apisecret=${apisecret:-$apisecretdef}
fi

################################
## Run commands
################################
## Build git2s3 lambda
build_stack_exists=`stack_status $build_stackname`
if [ -z "$build_stack_exists" ]; then
    echo -e
    echo "-- Creating build stack"
    create_stack $build_stackname "file://cf/build.yml" "" true true
    echo "done"

    echo -e
    echo "-- Running build"
    buildid=`aws codebuild start-build \
    --project-name git2s3-codebuild \
    $aws_options \
    --query "build.id" --output text`
    echo "buildid: $buildid"

    echo -e
    buildcomplete=false
    while [[ $buildcomplete != "True" ]]; do
    sleep 3
    echo -n '.'
    buildcomplete=`aws codebuild batch-get-builds \
    --ids $buildid \
    $aws_options \
    --query "builds[0].buildComplete" --output text`
    done
    echo "done"
fi

git2s3bucket=`import_value $build_stackname "OutputBucketName"`

############### create git2s3 stack

echo -e
echo "-- Creating cloudformation stack"
parameters="--parameters \
 ParameterKey=Git2S3Bucket,ParameterValue=${git2s3bucket} \
 ParameterKey=OutputBucketName,ParameterValue=${sourcesbucket} \
 ParameterKey=ApiSecret,ParameterValue=${apisecret} \
"
if [ ! -z "$memory" ]; then
    echo "not empty" 
    parameters="${parameters} ParameterKey=MaxMemory,ParameterValue=${memory}"
fi
create_stack $stackname "file://cf/git2s3.yml" "$parameters" true true

############### clean
echo -e
echo "-- Remove git2s3 build output bucket"
runcmd "aws s3 rm s3://${git2s3bucket} --recursive"
echo "done"

echo -e
echo "-- Deleting build stack"
delete_stack $build_stackname true

echo -e
echo "All done!"
echo -e
echo "-- Outputs"

# maybe it is known issue,
# but for some reasons describe-stacks returns nothing directly after
# stack-create-complete

echo -e
import_value $stackname "Git2S3WebHookApi"
echo -e
import_value $stackname "PublicSSHKey"
