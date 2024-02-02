import {
  CdkCustomResourceEvent,
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from "aws-lambda";
import {
  CreateRoleAliasCommand,
  DeleteRoleAliasCommand,
  IoTClient,
} from "@aws-sdk/client-iot";

const client = new IoTClient({});

export const handler: CdkCustomResourceHandler = async (
  event: CdkCustomResourceEvent,
): Promise<CdkCustomResourceResponse> => {
  console.log("Received event");
  console.log({ event });
  let physicalResourceId = undefined;
  const { IoTRoleAliasName, TokenRoleARN } = event.ResourceProperties;
  if (event.RequestType === "Create") {
    physicalResourceId = await createIotRoleAlias({
      IoTRoleAliasName,
      TokenRoleARN,
    });
  } else if (event.RequestType === "Update") {
    await deleteIotRoleAlias({
      roleAliasName: event.PhysicalResourceId,
    });
    physicalResourceId = await createIotRoleAlias({
      IoTRoleAliasName,
      TokenRoleARN,
    });
  } else if (event.RequestType === "Delete") {
    await deleteIotRoleAlias({
      roleAliasName: event.PhysicalResourceId,
    });
    physicalResourceId = event.PhysicalResourceId;
  }

  if (!physicalResourceId) {
    throw new Error("Invalid request type");
  }

  return {
    PhysicalResourceId: physicalResourceId,
  };
};

export const createIotRoleAlias = async ({
  IoTRoleAliasName,
  TokenRoleARN,
}: {
  IoTRoleAliasName: string;
  TokenRoleARN: string;
}): Promise<string> => {
  const command = new CreateRoleAliasCommand({
    roleAlias: IoTRoleAliasName,
    roleArn: TokenRoleARN,
    credentialDurationSeconds: 3600,
  });

  const response = await client.send(command);

  if (!response.roleAlias) {
    throw new Error("Invalid response");
  }

  return response.roleAlias;
};

export const deleteIotRoleAlias = async ({
  roleAliasName,
}: {
  roleAliasName: string;
}) => {
  const command = new DeleteRoleAliasCommand({
    roleAlias: roleAliasName,
  });

  return await client.send(command);
};
