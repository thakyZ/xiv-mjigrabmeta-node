import * as fs from "node:fs/promises";
import { existsSync, existsSync as fsExists } from "node:fs";
import * as path from "node:path";
import * as fsUtils from "nodejs-fs-utils";
import { exec } from "node:child_process";
import { series } from "async";

series([
  async () => {
    if (existsSync(path.join(__dirname, "dist"))) {
      await fsUtils.rmdirs(path.join(__dirname, "dist"));
    }
  },
  () => exec("pnpm run build"),
  async () => {
    if (existsSync(path.join(__dirname, "dist"))) {
      if (existsSync(path.join(__dirname, "config.json"))) {
        await fs.copyFile(path.join(__dirname, "config.json"), path.join(__dirname, "dist", "config.json"));
      }

      if (existsSync(path.join(__dirname, "ReSanctuary.json"))) {
        await fs.copyFile(path.join(__dirname, "ReSanctuary.json"), path.join(__dirname, "dist", "ReSanctuary.json"));
      }
    }
  }
])


