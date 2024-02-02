#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ThingsInstallerStack } from "../lib/thingsInstallerStack";

const app = new cdk.App();
new ThingsInstallerStack(app, "ThingsInstallerStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  projectName: "ThingsInstaller",
});

//どのような構成になっているか
// mainが以下を作成している
//     new ThingInstallerStack(appContext, appContext.appConfig.Stack.ThingInstaller);
//     new ThingMonitorStack(appContext, appContext.appConfig.Stack.ThingMonitor);
//
//     new ComponentUploadStack(appContext, appContext.appConfig.Stack.ComponentUpload);
//     new ComponentDeploymentStack(appContext, appContext.appConfig.Stack.ComponentDeployment);
//
//     new DataPipelineStack(appContext, appContext.appConfig.Stack.DataPipeline);
//
//     new CicdPipelineStack(appContext, appContext.appConfig.Stack.CicdPipeline);
// これらはカスタムリソースで定義している -> 一度作ってしまえばなんとでもなりそう
// GreenGrassのコンポーネントを作成する手順として、gg groupは必要
