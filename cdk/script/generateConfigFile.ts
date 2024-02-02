import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { writeFileSync } from "node:fs";
type ConfigJson = {
  ThingsInstallerStack: {
    OutputIoTTokenRoleAlias: string;
    OutputInstallerTempRoleARN: string;
    OutputIoTTokenRole: string;
  };
};

type GreengrassConfigJson = {
  Credentials: {
    AccessKeyId: string | undefined;
    SecretAccessKey: string | undefined;
    SessionToken: string | undefined;
    Expiration: Date | undefined;
  };
} & ConfigJson;
export const generateConfigFile = async () => {
  const configJson = require("../config/output.json");
  await getCredentialsAndWriteJson(configJson);
};

export const getCredentialsAndWriteJson = async (configJson: ConfigJson) => {
  const roleArn = configJson.ThingsInstallerStack.OutputInstallerTempRoleARN;
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

  const outputJson: GreengrassConfigJson = Object.assign({}, configJson, {
    Credentials: response.Credentials,
  });

  writeFileSync("greengrass-config.json", JSON.stringify(outputJson));
};

(async () => {
  await generateConfigFile();
})();
