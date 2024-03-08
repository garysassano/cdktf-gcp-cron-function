# cdktf-gcp-cron-function

CDKTF app that triggers a Cloud Function at a specified regular interval.

### Related Apps

- [cdk-aws-cron-function](https://github.com/garysassano/cdk-aws-cron-function) - Uses AWS instead of GCP; built with AWS CDK instead of CDKTF.

## Prerequisites

- **_GCP:_**
  - Must have authenticated with [Application Default Credentials](https://registry.terraform.io/providers/hashicorp/google/latest/docs/guides/provider_reference#running-terraform-on-your-workstation) in your local environment.
  - Must have set the `GCP_PROJECT_ID` and `GCP_REGION` variables in your local environment.
- **_Terraform:_**
  - Must be [installed](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli#install-terraform) in your system.
- **_Node.js + npm:_**
  - Must be [installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) in your system.

## Installation

```sh
npx projen install
```

## Deployment

```sh
npx projen deploy
```

## Cleanup

```sh
npx projen destroy
```

## Architecture Diagram

![Architecture Diagram](./src/assets/arch-diagram.svg)
