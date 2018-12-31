const debug = require('debug')(__filename.split('/').slice(-1).join())
const { mapper } = require('.')
const fs = require('fs')
const yargs = require('yargs')
require('completarr')()
const getStream = require('get-stream')
const path = require('path')

yargs
  // .completion()   now handled by completarr
  .help()
  .usage('$0 [options] [input_files...]')
//  .example('$0 sample/basicnov2018.csv.1', 'Convert to N-Quads, all default shapes')
  .config('config')
  .env('PSDAD')
  .epilogue('All values can be set in config.json and environment variables starting with PSDAD_')
  .option('schema', {
    alias: 's',
    describe: 'node.js module name for the schema'
  })
  .argv

const argv = yargs.argv
debug('argv = %O', argv)

const main = async (sources, argv) => {
  if (sources.length === 0) {
    await handle('-', process.stdin)
  } else {
    for (const s of sources) {
      await handle(s, fs.createReadStream(s))
    }
  }
}

async function handle (name, stream) {
  const schemaModule = argv.s
  if (!schemaModule) {
    console.error('need to specify schema')
    process.exit(1)
  }
  // make it absolute?

  const m = mapper({trace: true})

  // m.addModule  ?
  const s = require(path.resolve(schemaModule))
  // console.log('schema: %o', Object.keys(s))
  for (const cls of Object.values(s)) {
    m.add(cls)
  }
  
  debug('parsing')

  const text = await getStream(stream)
  const out = m.parse(text)

  // const str = m.stringify(data)
}

/*
  let outStream = process.stdout
  if (argv.out) {
    outStream = fs.createWriteStream(argv.out)
  }
*/

main(argv._, argv)



