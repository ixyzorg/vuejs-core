import { defineConfig, RolldownOptions } from 'rolldown'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)

const __dirname = path.dirname(__filename)

const packagesDir = path.resolve(__dirname, 'packages')

const packageDirs = fs.readdirSync(packagesDir).filter(dir => {
  const fullPath = path.join(packagesDir, dir)
  return fs.statSync(fullPath).isDirectory()
})

const packageBuildEntries:RolldownOptions[] = packageDirs.map(dir => ({
  input:path.join(packagesDir, dir, 'src/index.ts'),
  output:{
    format: 'esm',
    dir:path.join(packagesDir, dir, 'dist'),
    entryFileNames:`${dir}.esm.js`,
    cleanDir:true,
    sourcemap:true,
  },
  platform:'browser',
  treeshake:true,
}))

export default defineConfig(packageBuildEntries)
