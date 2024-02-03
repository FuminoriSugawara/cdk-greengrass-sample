import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
type ConfigJson = {
  ThingsInstallerStack: {
    ThingName: string;
    ThingGroupNames: string;
    ProjectRegion: string;
    IoTTokenRole: string;
    IoTTokenRoleAlias: string;
    InstallerTempRoleARN: string;
  };
};

type GreengrassConfigJson = {
  Credentials: {
    AccessKeyId: string;
    SecretAccessKey: string;
    SessionToken: string;
  };
} & ConfigJson;

export const generateConfigFile = async () => {
  const cdkOutputJsonPath = process.argv[2];
  if (!cdkOutputJsonPath) {
    throw new Error("config file path is not provided");
  }
  const configJson = require(
    join(process.cwd(), cdkOutputJsonPath),
  ) as ConfigJson;
  await getCredentialsAndWriteJson(configJson);
};

export const getCredentialsAndWriteJson = async (configJson: ConfigJson) => {
  const roleArn = configJson.ThingsInstallerStack.InstallerTempRoleARN;
  const roleSessionName = "TempRoleSession";

  const command = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: roleSessionName,
  });

  const client = new STSClient({});

  const response = await client.send(command);

  if (!response.Credentials) {
    throw new Error("Invalid response");
  }

  const { AccessKeyId, SecretAccessKey, SessionToken } = response.Credentials;
  if (!AccessKeyId || !SecretAccessKey || !SessionToken) {
    throw new Error("Invalid credentials");
  }

  const outputJson: GreengrassConfigJson = Object.assign({}, configJson, {
    Credentials: {
      AccessKeyId,
      SecretAccessKey,
      SessionToken,
    },
  });

  writeFileSync("greengrass-config.json", JSON.stringify(outputJson));
};

(async () => {
  await generateConfigFile();
})();
