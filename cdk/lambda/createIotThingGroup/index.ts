import {
  CdkCustomResourceEvent,
  CdkCustomResourceHandler,
  CdkCustomResourceResponse,
} from "aws-lambda";
import {
  CreateThingGroupCommand,
  DeleteThingGroupCommand,
  IoTClient,
} from "@aws-sdk/client-iot";

const client = new IoTClient({});

export const handler: CdkCustomResourceHandler = async (
  event: CdkCustomResourceEvent,
): Promise<CdkCustomResourceResponse> => {
  console.log("Received event");
  console.log({ event });
  const { ThingGroupName } = event.ResourceProperties;
  let physicalResourceId = undefined;
  if (event.RequestType === "Create") {
    physicalResourceId = await createIotThingGroup({
      thingGroupName: ThingGroupName,
    });
  } else if (event.RequestType === "Update") {
    await deleteIotThingGroup({ thingGroupName: ThingGroupName });
    physicalResourceId = await createIotThingGroup({
      thingGroupName: ThingGroupName,
    });
  } else if (event.RequestType === "Delete") {
    await deleteIotThingGroup({ thingGroupName: ThingGroupName });
    physicalResourceId = event.PhysicalResourceId;
  }

  if (!physicalResourceId) {
    throw new Error("Invalid request type");
  }

  return {
    PhysicalResourceId: physicalResourceId,
  };
};

export const createIotThingGroup = async ({
  thingGroupName,
}: {
  thingGroupName: string;
}): Promise<string> => {
  const command = new CreateThingGroupCommand({
    thingGroupName,
  });

  const response = await client.send(command);

  if (!response.thingGroupArn) {
    throw new Error("Invalid response");
  }

  return response.thingGroupArn;
};

export const deleteIotThingGroup = async ({
  thingGroupName,
}: {
  thingGroupName: string;
}) => {
  const command = new DeleteThingGroupCommand({
    thingGroupName,
  });

  return await client.send(command);
};
