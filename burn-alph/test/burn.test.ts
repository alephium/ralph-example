import { web3, Project, ONE_ALPH, Address, DUST_AMOUNT } from '@alephium/web3'
import { getSigner } from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import { BurnALPH, BurnALPHScript } from '../artifacts/ts'
import { randomInt } from 'crypto'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
const nodeProvider = web3.getCurrentNodeProvider()

describe('integration tests', () => {
  beforeAll(async () => {
    await Project.build()
  })

  async function getALPHBalance(address: Address): Promise<bigint> {
    const balances = await nodeProvider.addresses.getAddressesAddressBalance(address)
    return BigInt(balances.balance)
  }

  it('should burn alph on devnet', async () => {
    const deployments = await deployToDevnet()
    const burnALPH = deployments.getInstance(BurnALPH)!
    const signer = await getSigner(ONE_ALPH * 100n, 0)
    const accountBalance0 = await getALPHBalance(signer.address)
    expect(accountBalance0).toEqual(ONE_ALPH * 100n)

    const contractBalance0 = (await burnALPH.fetchState()).asset.alphAmount
    expect(contractBalance0).toEqual(ONE_ALPH)

    const burntAmount = BigInt(randomInt(1, 50))
    const result = await BurnALPHScript.execute(signer, {
      initialFields: {
        burnALPH: burnALPH.contractId,
        amount: ONE_ALPH * burntAmount
      },
      attoAlphAmount: ONE_ALPH * burntAmount + DUST_AMOUNT
    })
    const gasFee = BigInt(result.gasAmount) * BigInt(result.gasPrice)

    const accountBalance1 = await getALPHBalance(signer.address)
    expect(accountBalance1).toEqual((100n - burntAmount) * ONE_ALPH - gasFee)

    const contractBalance1 = (await burnALPH.fetchState()).asset.alphAmount
    expect(contractBalance1).toEqual(ONE_ALPH + burntAmount * ONE_ALPH)
  }, 20000)
})
