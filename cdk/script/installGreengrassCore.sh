CONFIG_FILE=$1

if [ -z $CONFIG_FILE ]; then
  echo "Usage: $0 <CONFIG_FILE>"
  exit 1
fi

# Install jq
if [ -z $(which jq) ]; then
  sudo apt-get update
  sudo apt-get install jq -y
fi

# Install Java
if [ -z $(which java) ]; then
  sudo apt-get update
  sudo apt-get install default-jdk -y
fi

# Install curl
if [ -z $(which curl) ]; then
  sudo apt-get update
  sudo apt-get install curl -y
fi

# Install unzip
if [ -z $(which unzip) ]; then
  sudo apt-get update
  sudo apt-get install unzip -y
fi


JQ_ARG='.ThingsInstallerStack.ThingName'
THING_NAME=$(cat $CONFIG_FILE | jq -r $JQ_ARG) #ex>

JQ_ARG='.ThingsInstallerStack.ThingGroupName'
THING_GROUP=$(cat $CONFIG_FILE | jq -r $JQ_ARG) #ex>

JQ_ARG='.ThingsInstallerStack.Region'
REGION=$(cat $CONFIG_FILE | jq -r $JQ_ARG) #ex>

JQ_ARG='.ThingsInstallerStack.IoTTokenRole'
ROLE_NAME=$(cat $CONFIG_FILE | jq -r $JQ_ARG) #ex>

JQ_ARG='.ThingsInstallerStack.IoTTokenRoleAlias'
ROLE_ALIAS_NAME=$(cat $CONFIG_FILE | jq -r $JQ_ARG) #ex>

export AWS_ACCESS_KEY_ID=$(cat $CONFIG_FILE | jq -r '.Credentials.AccessKeyId')
export AWS_SECRET_ACCESS_KEY=$(cat $CONFIG_FILE | jq -r '.Credentials.SecretAccessKey')
export AWS_SESSION_TOKEN=$(cat $CONFIG_FILE | jq -r '.Credentials.SessionToken')

echo THING_NAME=$THING_NAME
echo THING_GROUP=$THING_GROUP
echo REGION=$REGION
echo ROLE_NAME=$ROLE_NAME
echo ROLE_ALIAS_NAME=$ROLE_ALIAS_NAME
echo AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
echo AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
echo AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN

DEV_ENV=true

java -version

mkdir greengrass
cd greengrass
INSTALL_ROOT=GreengrassCore
curl -s https://d2s8p88vqu9w66.cloudfront.net/releases/greengrass-nucleus-latest.zip > greengrass-nucleus-latest.zip && unzip greengrass-nucleus-latest.zip -d GreengrassCore

GREENGRASS_ROOT=/greengrass/v2
GREENGRASS_JAR=./GreengrassCore/lib/Greengrass.jar
sudo -E java -Droot=$GREENGRASS_ROOT \
  -Dlog.store=FILE \
  -jar $GREENGRASS_JAR \
  --aws-region $REGION \
  --thing-name $THING_NAME \
  --thing-group-name $THING_GROUP \
  --tes-role-name $ROLE_NAME \
  --tes-role-alias-name $ROLE_ALIAS_NAME \
  --component-default-user ggc_user:ggc_group \
  --provision true \
  --setup-system-service true
