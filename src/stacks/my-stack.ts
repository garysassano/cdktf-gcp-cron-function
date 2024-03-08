import path from "path";
import { AssetType, TerraformAsset, TerraformStack } from "cdktf";
import { Construct } from "constructs";
import { GoogleProvider } from "../../.gen/providers/google/provider";
import { StorageBucket } from "../../.gen/providers/google/storage-bucket";
import { StorageBucketObject } from "../../.gen/providers/google/storage-bucket-object";
import { CloudfunctionsFunction } from "../../.gen/providers/google/cloudfunctions-function";
import { ServiceAccount } from "../../.gen/providers/google/service-account";
import { CloudSchedulerJob } from "../../.gen/providers/google/cloud-scheduler-job";
import { CloudfunctionsFunctionIamMember } from "../../.gen/providers/google/cloudfunctions-function-iam-member";
import { ProjectService } from "../../.gen/providers/google/project-service";

export class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const uniqueId = this.node.addr.substring(0, 8);

    // Read GCP_PROJECT_ID and GCP_REGION from environment variables
    const gcpProjectId = process.env.GCP_PROJECT_ID;
    const gcpRegion = process.env.GCP_REGION;
    if (!gcpProjectId || !gcpRegion) {
      throw new Error(
        "Required environment variables 'GCP_PROJECT_ID' or 'GCP_REGION' are missing or undefined"
      );
    }

    const gcpProvider = new GoogleProvider(this, "GcpProvider", {
      project: gcpProjectId,
      region: gcpRegion,
    });

    const cloudSchedulerApi = new ProjectService(this, "CloudSchedulerAPI", {
      service: "cloudscheduler.googleapis.com",
      disableOnDestroy: false,
    });

    // Convert path's AssetType from DIRECTORY to ARCHIVE
    const cronFunctionAsset = new TerraformAsset(this, "CronFunctionAsset", {
      path: path.join(__dirname, "../functions/cron"),
      type: AssetType.ARCHIVE,
    });

    const cronFunctionSourceBucket = new StorageBucket(
      this,
      "CronFunctionSourceBucket",
      {
        name: `cron-function-source-bucket-${uniqueId}`,
        location: gcpProvider.region!,
      }
    );

    const cronFunctionSourceObject = new StorageBucketObject(
      this,
      "CronFunctionSourceObject",
      {
        name: "function-source.zip",
        bucket: cronFunctionSourceBucket.name,
        source: cronFunctionAsset.path,
      }
    );

    const cronFunctionServiceAccount = new ServiceAccount(
      this,
      "CronFunctionServiceAccount",
      {
        accountId: `cron-function-${uniqueId}-sa`,
        displayName: `Service Account for cron-function-${uniqueId}`,
      }
    );

    const cronFunction = new CloudfunctionsFunction(this, "CronFunction", {
      name: `cron-function-${uniqueId}`,
      region: gcpProvider.region!,
      runtime: "nodejs20",
      sourceArchiveBucket: cronFunctionSourceBucket.name,
      sourceArchiveObject: cronFunctionSourceObject.name,
      entryPoint: "handler",
      triggerHttp: true,
      httpsTriggerSecurityLevel: "SECURE_ALWAYS",
      serviceAccountEmail: cronFunctionServiceAccount.email,
    });

    const schedulerServiceAccount = new ServiceAccount(
      this,
      "SchedulerServiceAccount",
      {
        accountId: `scheduler-${uniqueId}-sa`,
        displayName: `Service Account for scheduler-${uniqueId}`,
      }
    );

    new CloudfunctionsFunctionIamMember(this, "CronFunctionInvoker", {
      project: cronFunction.project,
      region: cronFunction.region,
      cloudFunction: cronFunction.name,
      role: "roles/cloudfunctions.invoker",
      member: `serviceAccount:${schedulerServiceAccount.email}`,
    });

    new CloudSchedulerJob(this, "Scheduler", {
      name: `scheduler-${uniqueId}`,
      description: `Trigger ${cronFunction.name} every minute`,
      schedule: "* * * * *",
      timeZone: "Etc/UTC",
      attemptDeadline: "300s",
      httpTarget: {
        httpMethod: "GET",
        uri: cronFunction.httpsTriggerUrl,
        oidcToken: { serviceAccountEmail: schedulerServiceAccount.email },
      },
      dependsOn: [cloudSchedulerApi],
    });
  }
}
