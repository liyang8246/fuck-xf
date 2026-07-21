import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  ignores: ['**/dist', '**/node_modules'],
  stylistic: {
    indent: 2,
    quotes: 'single',
  },
  typescript: true,
  jsonc: false,
  yaml: false,
})
