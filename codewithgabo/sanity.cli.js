import {defineCliConfig} from 'sanity/cli'
const esbuild = require('esbuild-wasm')

export default defineCliConfig({
  api: {
    projectId: 'nnt7ytcd',
    dataset: 'production',
  },
})
