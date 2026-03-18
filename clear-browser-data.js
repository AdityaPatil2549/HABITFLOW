import { clearAllData } from './src/db/clearData.js'

console.log('Clearing all data...')
await clearAllData()
console.log('Data cleared! You can now refresh the browser.')
