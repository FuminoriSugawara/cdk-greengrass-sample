## Overview
This repository is a sample that uses AWS CDK v2 to deploy an AWS Greengrass Core Device.

## How to Run
Move to the `cdk` directory.
The following work is done in the terminal.

Please replace the AWS profile for each environment. This is defined in the AWS CLI configuration files (`~/.aws/config` and `~/.aws/credentials`).

### CDK deploy
To initialize AWS CDK, perform `cdk bootstrap`.
```shell
cdk bootstrap --profile={your-profile}
```

To deploy the stack using AWS CDK, perform `cdk deploy`.
At this time, use the `outputs-file` option to output the results of `CfnOutput` to a JSON file.
```shell
cdk deploy --profile={your-profile} --outputs-file ./cdk-output.json
```

When the deployment is complete, `cdk-output.json` is generated under the `cdk` directory.

### Generate Configuration File
Run the following command. In this process, it obtains credentials that temporarily have the necessary permissions to install the Greengrass Core device and generates a new JSON file.
```shell
AWS_PROFILE={your-profile} npx ts-node script/generateConfigFile.ts cdk-output.json
```
When the above process is complete, `greengrass-config.json` is created.

### Transfer Configuration File and Installation Script to Ubuntu Machine
Set the SSH connection destination information as `your-server` in `.ssh/config`.

Run the following command.

Transfer the generated `greengrass-config.json` and the shell script `installGreengrassCore.sh` that installs Greengrass Core to the Ubuntu machine with scp.
```shell
scp script/installGreengrassCore.sh greengrass-config.json {your-server}:~
```

### Work on Ubuntu Machine
Connect to the Ubuntu machine via ssh and run the following command to install Greengrass Core.
```shell
. ./installGreengrassCore.sh greengrass-config.json
```

Go to the Greengrass section of the AWS console and check that `MyThing` is registered in the device list.

That's all.