import { javascript } from "projen";
import { CdktfTypeScriptApp } from "projen-cdktf-app-ts";

const project = new CdktfTypeScriptApp({
  cdktfVersion: "0.20.11",
  defaultReleaseBranch: "main",
  depsUpgradeOptions: { workflow: false },
  devDeps: ["projen-cdktf-app-ts"],
  eslint: true,
  minNodeVersion: "22.14.0",
  name: "cdktf-gcp-cron-function",
  packageManager: javascript.NodePackageManager.PNPM,
  pnpmVersion: "10",
  prettier: true,
  projenrcTs: true,

  terraformProviders: ["hashicorp/google@~> 6.28.0"],
});

// Generate CDKTF constructs after installing deps
project.tasks.tryFind("install")?.spawn(project.cdktfTasks.get);

project.synth();
