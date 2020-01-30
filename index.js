var { ApiPromise, WsProvider } = require('@polkadot/api');
var { TypeRegistry, createType } = require('@polkadot/types');

let customTypes = {
  BenchmarkParameter: {
    _enum: [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z'
    ]
  },
  BenchmarkResult: 'u128',
  BenchmarkInput: '(Vec<(BenchmarkParameter, u32)>, u32)',
  CallRequest: {
    parameters: 'Vec<(BenchmarkParameter, u32)>',
    repeat: 'u32'
  }
};

const registry = new TypeRegistry();

const fs = require('fs');
let rawdata = fs.readFileSync('output.json');
let data = JSON.parse(rawdata);

// Main function which needs to run at start
async function main() {
  // Substrate node we are connected to and listening to remarks
  const provider = new WsProvider('ws://localhost:9944');

  const api = await ApiPromise.create({ provider, types: customTypes });

  // Get general information about the node we are connected to
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version()
  ]);
  console.log(
    `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
  );

  registry.register(customTypes);

  let components = await api.rpc.state.call(
    'IdentityBenchmarks_get_components',
    ''
  );

  let bp = createType(
    registry,
    'Vec<(BenchmarkParameter, u32, u32)>',
    components
  );

  console.log(bp.toString());

  const steps = 10;

  //parameters: Vec<(BenchmarkParameter, u32)>, repeat: u32

  for (let r = 0; r < 16; r += 1) {
    for (let i = 0; i < 2; i += 1) {
      let x = 10;
      const hex = createType(registry, 'CallRequest', {
        parameters: [
          ['R', r],
          ['X', x]
        ],
        repeat: 50
      }).toHex();

      console.log('Hex', hex);

      let encodedResults = await api.rpc.state.call(
        'IdentityBenchmarks_run_benchmark',
        hex
      );

      let results = createType(
        registry,
        'Vec<BenchmarkResult>',
        encodedResults
      );
      console.log(results.toString());
      results.map(result => data.push([r, x, result]));
      let newData = JSON.stringify(data);
      fs.writeFileSync('output.json', newData);
    }
  }

  console.log("== Done ==");
}

main().catch(console.error);
