const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    console.log("Starting compilation...");
    await hre.run("compile");
    console.log("Compilation complete.");
    
    const artifactPath = path.join(process.cwd(), "artifacts", "backend", "blockchain", "SmartContract.sol", "SmartContract.json");
    console.log("Looking for artifact at:", artifactPath);
    
    if (!fs.existsSync(artifactPath)) {
      console.error("ERROR: Artifact file not found!");
      console.log("Checking if artifacts directory exists...");
      const artifactsDir = path.join(process.cwd(), "artifacts");
      if (fs.existsSync(artifactsDir)) {
        console.log("Artifacts directory exists. Listing contents...");
        function listDir(dir, depth = 0) {
          const items = fs.readdirSync(dir);
          items.forEach(item => {
            const fullPath = path.join(dir, item);
            const indent = "  ".repeat(depth);
            if (fs.statSync(fullPath).isDirectory()) {
              console.log(indent + item + "/");
              listDir(fullPath, depth + 1);
            } else {
              console.log(indent + item);
            }
          });
        }
        listDir(artifactsDir);
      } else {
        console.error("Artifacts directory does not exist!");
      }
      process.exit(1);
    }
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const bytecode = artifact.bytecode;
    
    console.log("\n=== BYTECODE EXTRACTED ===");
    console.log("Bytecode length:", bytecode.length);
    console.log("First 100 chars:", bytecode.substring(0, 100));
    
    // Write to file
    fs.writeFileSync("bytecode.txt", bytecode);
    console.log("\nBytecode written to bytecode.txt");
    
    // Also write formatted for deploy.html
    const formatted = `    const bytecode = "${bytecode}";`;
    fs.writeFileSync("bytecode-formatted.txt", formatted);
    console.log("Formatted bytecode written to bytecode-formatted.txt");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

