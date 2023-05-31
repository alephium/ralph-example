import { Deployments } from '@alephium/cli'
import { web3, Project, DUST_AMOUNT } from '@alephium/web3'
import { testNodeWallet } from '@alephium/web3-test'
import configuration from '../alephium.config'
import { OldGet, Migrate, MigrateWithFields, NewGet, NewSet } from '../artifacts/ts'

async function main() {
  web3.setCurrentNodeProvider('http://127.0.0.1:22973')
  // Compile the contracts of the project if they are not compiled
  Project.build()

  
}

main()
