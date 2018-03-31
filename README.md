## Installation

OSX only: Install brew if not installed

    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

OSX only: libcrypto must be installed (required for nodegit) 

    brew install libgcrypt

Command line

    ./deploy.sh

Arguments:

    -sb, --sources-bucket   Bucket with sources
    -n, --stack-name        Cloud Formation Stack name
    -s, --secret            Secret phrase
    -p, --profile           AWS profile
    -r, --region            AWS region
    -m, --max-memory        Memory limit for lambda (128 by default). Important if sources are huge
    --clean                 Clear deployment (clear AWS resources)

Example:

    ./deploy.sh -n git2s3 -s qwerty123 -p default -r us-east-1
    
Clean

    ./deploy.sh --clean -n git2s3 -p default -r us-east-1


Stage variables:
- 'Branches' - Branches you would like to follow  (comma separated list, e.g. develop,master)
- 'AllowedIPs' - Allowed IPs. Comma seperated list of IP CIDR blocks for source IP authentication.
    (e.g. The BitBucket Cloud IP ranges: '131.103.20.160/27,165.254.145.0/26,104.192.143.0/24')

## License

The MIT License

Copyright (c) 2015 Andrey Pavlov <andrew.m.pavlov@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
