const solc = require("solc");
const fs = require("fs");
const path = require("path");

// Read the contract
const contractPath = path.join(__dirname, "backend", "blockchain", "SmartContract.sol");
const contractSource = fs.readFileSync(contractPath, "utf8");

console.log("Compiling contract with solc...");

// Prepare input for solc
const input = {
  language: "Solidity",
  sources: {
    "SmartContract.sol": {
      content: contractSource
    }
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"]
      }
    }
  }
};

// Compile
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  const errors = output.errors.filter(e => e.severity === "error");
  if (errors.length > 0) {
    console.error("Compilation errors:");
    errors.forEach(err => console.error(err.message));
    process.exit(1);
  }
}

const contract = output.contracts["SmartContract.sol"]["SmartContract"];
const bytecode = contract.evm.bytecode.object;
const abi = contract.abi;

console.log("\n=== COMPILATION SUCCESSFUL ===");
console.log("Bytecode length:", bytecode.length);
console.log("First 100 chars:", bytecode.substring(0, 100));

// Write bytecode
fs.writeFileSync("bytecode-new.txt", bytecode);
console.log("\nBytecode written to bytecode-new.txt");

// Write formatted for deploy.html
const formatted = `    const bytecode = "0x${bytecode}";`;
fs.writeFileSync("bytecode-for-deploy.txt", formatted);
console.log("Formatted bytecode written to bytecode-for-deploy.txt");

// Also write ABI for reference
fs.writeFileSync("abi-new.json", JSON.stringify(abi, null, 2));
console.log("ABI written to abi-new.json");

console.log("\n=== BYTECODE (first 200 chars) ===");
console.log("0x" + bytecode.substring(0, 200));

