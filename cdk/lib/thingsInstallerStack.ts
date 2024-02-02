import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as customResources from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

interface Props extends cdk.StackProps {
  projectName: string;
}

export class ThingsInstallerStack extends cdk.Stack {
  projectPrefix: string;
  installerRoleName: string;
  installerGroupName: string;
  createIotThingGroupLambdaName: string;
  createIotRoleAliasLambdaName: string;
  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);
    this.projectPrefix = props.projectName;
    this.installerRoleName = "InstallerRole";
    this.installerGroupName = "InstallerGroup";
    this.createIotThingGroupLambdaName = "CreateIotThingGroupLambda";
    this.createIotRoleAliasLambdaName = "CreateIotRoleAliasLambda";
    this.createCredential();
    this.createIotThingGroup();
    this.createIoTRoleAlias("GreengrassV2TokenExchangeRole");
  }

  createIotThingGroup() {
    const lambdaName: string = `${this.projectPrefix}-${this.createIotThingGroupLambdaName}`;

    const lambdaRole = new iam.Role(
      this,
      `${this.createIotThingGroupLambdaName}Role`,
      {
        roleName: `${lambdaName}Role`,
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          {
            managedPolicyArn:
              "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          },
        ],
      },
    );
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["iot:CreateThingGroup", "iot:DeleteThingGroup"],
        effect: iam.Effect.ALLOW,
        resources: ["*"],
      }),
    );

    const func = new lambda.Function(this, this.createIotThingGroupLambdaName, {
      functionName: `${lambdaName}Function`,
      code: lambda.Code.fromAsset("./lambda/createIotThingGroup"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(120),
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
    });

    const provider = new customResources.Provider(
      this,
      "CreateIotGroupProvider",
      {
        onEventHandler: func,
      },
    );

    new cdk.CustomResource(this, "CreateIotGroupCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        ThingGroupName: this.installerGroupName,
      },
    });
  }

  createCredential() {
    const thingProvisionPolicyStatement =
      this.createThingInstallerProvisionPolicy();
    const thingDevEnvPolicyStatement = this.createThingInstallerDevEnvPolicy();

    this.createInstallerTempRole(
      thingProvisionPolicyStatement,
      thingDevEnvPolicyStatement,
    );
  }

  // https://docs.aws.amazon.com/greengrass/v2/developerguide/provision-minimal-iam-policy.html
  createThingInstallerProvisionPolicy(): iam.PolicyStatement {
    const statement = {
      Effect: "Allow",
      Action: [
        "iot:AddThingToThingGroup",
        "iot:AttachPolicy",
        "iot:AttachThingPrincipal",
        "iot:CreateKeysAndCertificate",
        "iot:CreatePolicy",
        "iot:CreateRoleAlias",
        "iot:CreateThing",
        "iot:DescribeEndpoint",
        "iot:DescribeRoleAlias",
        "iot:DescribeThingGroup",
        "iot:GetPolicy",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:PassRole",
        "iam:CreatePolicy",
        "iam:AttachRolePolicy",
        "iam:GetPolicy",
        "sts:GetCallerIdentity",
      ],
      Resource: "*",
    };

    return iam.PolicyStatement.fromJson(statement);
  }

  createThingInstallerDevEnvPolicy(): iam.PolicyStatement {
    const statement = {
      Sid: "DeployDevTools",
      Effect: "Allow",
      Action: [
        "greengrass:CreateDeployment",
        "iot:CancelJob",
        "iot:CreateJob",
        "iot:DeleteThingShadow",
        "iot:DescribeJob",
        "iot:DescribeThing",
        "iot:DescribeThingGroup",
        "iot:GetThingShadow",
        "iot:UpdateJob",
        "iot:UpdateThingShadow",
      ],
      Resource: "*",
    };

    return iam.PolicyStatement.fromJson(statement);
  }

  createInstallerTempRole(
    provisionStatement: iam.PolicyStatement,
    devEnvStatement: iam.PolicyStatement,
  ) {
    const tempRole = new iam.Role(this, this.installerRoleName, {
      roleName: `${this.projectPrefix}-${this.installerRoleName}`,
      assumedBy: new iam.AccountPrincipal(this.account),
    });

    tempRole.addToPolicy(provisionStatement);
    tempRole.addToPolicy(devEnvStatement);

    this.exportOutput({
      key: "InstallerTempRoleARN",
      value: tempRole.roleArn,
    });
  }

  createIoTRoleAlias(roleName: string) {
    const tokenRole = new iam.Role(this, roleName, {
      roleName: `${this.projectPrefix}-${roleName}`,
      assumedBy: new iam.ServicePrincipal("credentials.iot.amazonaws.com"),
    });
    tokenRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "iot:DescribeCertificate",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "iot:Connect",
          "iot:Publish",
          "iot:Subscribe",
          "iot:Receive",
          "s3:GetObject",
          "s3:PutObject",
          "s3:GetBucketLocation",
        ],
        resources: ["*"],
      }),
    );

    const tokenRoleAliasName = `${this.projectPrefix}-${roleName}Alias`;

    const lambdaName: string = `${this.projectPrefix}-${this.createIotRoleAliasLambdaName}`;

    const lambdaRole = new iam.Role(
      this,
      `${this.createIotRoleAliasLambdaName}Role`,
      {
        roleName: `${lambdaName}Role`,
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        managedPolicies: [
          {
            managedPolicyArn:
              "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          },
        ],
      },
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["iot:*"],
        effect: iam.Effect.ALLOW,
        resources: ["*"],
      }),
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["iam:*"],
        effect: iam.Effect.ALLOW,
        resources: ["*"],
      }),
    );

    const func = new lambda.Function(this, this.createIotRoleAliasLambdaName, {
      functionName: lambdaName,
      code: lambda.Code.fromAsset("./lambda/createIotRoleAlias"),
      handler: "index.handler",
      timeout: cdk.Duration.seconds(60),
      runtime: lambda.Runtime.NODEJS_20_X,
      role: lambdaRole,
    });

    const provider = new customResources.Provider(this, "IoTRoleAlias", {
      onEventHandler: func,
    });

    new cdk.CustomResource(this, "IoTRoleAliasCustomResource", {
      serviceToken: provider.serviceToken,
      properties: {
        TokenRoleARN: tokenRole.roleArn,
        IoTRoleAliasName: tokenRoleAliasName,
      },
    });

    this.exportOutput({ key: "IoTTokenRole", value: tokenRole.roleName });
    this.exportOutput({ key: "IoTTokenRoleAlias", value: tokenRoleAliasName });
  }

  exportOutput({ key, value }: { key: string; value: string }) {
    new cdk.CfnOutput(this, `Output-${key}`, {
      exportName: `${this.projectPrefix}-${key}`,
      value: value,
    });
  }
}
