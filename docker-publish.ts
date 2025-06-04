import child_process from "child_process";
import cliSelect from "cli-select";
import fs from "fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
const version = packageJson.version as string;

const versionUpdateValues = {
  Current: version,
  Patch: updateVersion(version, "Patch"),
  Minor: updateVersion(version, "Minor"),
  Major: updateVersion(version, "Major"),
};
const versionUpdateValueKeys = Object.keys(
  versionUpdateValues,
) as (keyof typeof versionUpdateValues)[];

console.log("Select the version update type:");

const versionUpdate = await cliSelect({
  values: versionUpdateValueKeys,
  valueRenderer: (value: keyof typeof versionUpdateValues) => {
    return `${value} (${versionUpdateValues[value]})`;
  },
  cleanup: true,
});

const versionUpdateValue = versionUpdateValues[versionUpdate.value];

console.log(`You selected: ${versionUpdateValue}, current version: ${version}`);
console.log(
  "Do you want to build, publish the image and update the version in package.json?",
);

const confirm = await cliSelect({
  values: ["Yes", "No"],
  valueRenderer: (value) => {
    return value;
  },
  cleanup: true,
});

if (confirm.value === "Yes") {
  // Update the version in package.json
  packageJson.version = versionUpdateValue;
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "\t"));
  console.log(`Version updated to: ${versionUpdateValue}`);

  // Build the Docker image
  await spawnProcess("docker", [
    "build",
    "-t",
    `energyhun24/bandwidth-hero-proxy:${versionUpdateValue}`,
    "-t",
    "energyhun24/bandwidth-hero-proxy:latest",
    ".",
  ]);

  // Publish the image to Docker Hub
  await spawnProcess("docker", [
    "push",
    `energyhun24/bandwidth-hero-proxy:${versionUpdateValue}`,
  ]);
  await spawnProcess("docker", [
    "push",
    "energyhun24/bandwidth-hero-proxy:latest",
  ]);

  if (versionUpdateValue !== version) {
    // Push changes to GIT
    await spawnProcess("git", ["add", "package.json"]);
    await spawnProcess("git", [
      "commit",
      "-m",
      `"chore: update version to ${versionUpdateValue}"`,
    ]);
    await spawnProcess("git", ["push"]);
    await spawnProcess("git", ["checkout", "main"]);
  }
} else {
  console.log("Aborted.");
}

/* Utility functions */

function updateVersion(version: string, type: string) {
  const versionParts = version.split(".").map(Number);

  switch (type) {
    case "Major":
      versionParts[0]++;
      versionParts[1] = 0;
      versionParts[2] = 0;
      break;
    case "Minor":
      versionParts[1]++;
      versionParts[2] = 0;
      break;
    case "Patch":
      versionParts[2]++;
      break;
    default:
      throw new Error("Invalid version type");
  }

  return versionParts.join(".");
}

async function spawnProcess(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const cps = child_process.spawn(command, args, {
      stdio: "inherit",
      shell: true,
    });

    cps.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Child process exited with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}
