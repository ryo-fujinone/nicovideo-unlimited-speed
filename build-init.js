import fs from "fs-extra";
import path from "path";

const main = () => {
  const distDir = "dist";

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const targetDir = path.join(distDir, "src");
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true });
  }
  fs.copySync("src/", targetDir);
  fs.copySync("LICENSE", path.join(targetDir, "LICENSE"));

  const manifest = JSON.parse(
    fs.readFileSync(path.join("src", "manifest.json"), "utf-8")
  );
  const browserSpecificSettings = {
    gecko: {
      id: "nicovideo-unlimited-speed@ryo-fujinone.net",
      strict_min_version: "138.0",
    },
  };
  manifest.browser_specific_settings = browserSpecificSettings;
  const releaseManifestPath = path.join(targetDir, "manifest.json");
  const releaseManifestJSON = JSON.stringify(manifest, undefined, 2);
  fs.writeFile(releaseManifestPath, releaseManifestJSON);
};

main();
