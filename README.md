## Installation

OSX only: Install brew if not installed

    ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

OSX only: libcrypto must be installed (required for nodegit) 

    brew install libgcrypt

Command line

    ./deploy.sh

Arguments:

    -b, --bucket            Lamda deployment bucket name.
    -n, --stack-name        Cloud Formation Stack name
    -ip, --allowed-ips      Allowed IPs
    -s, --secret            Secret phrase
    -p, --profile           AWS profile
    -r, --region            AWS region
    --clean                 Clear deployment (clear AWS resources)

Example:

    ./deploy.sh -b git2s3.content -n git2s3-cf -ip 0.0.0.0/0 -s qwerty123 -p retec -r us-east-1
    
Clean

    ./deploy.sh --clean -b git2s3.content -n git2s3-cf -p retec -r us-east-1

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
