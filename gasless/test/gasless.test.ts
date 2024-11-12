import { web3, ONE_ALPH } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import { Gasless, PayGas, PayNoGas } from '../artifacts/ts'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
const nodeProvider = web3.getCurrentNodeProvider()

describe('integration tests', () => {
  it('should pay gas fee when needed', async () => {
    const initialBalance = ONE_ALPH * 100n
    const [contractDeployer, signer] = await getSigners(2, initialBalance, 0)
    const { contractInstance } = await Gasless.deploy(
      contractDeployer,
      {
        initialFields: {},
        initialAttoAlphAmount: ONE_ALPH * 10n
      }
    )

    await PayNoGas.execute(signer, { initialFields: { gaslessContract: contractInstance.contractId } })
    const balanceAfterPayNoGas = await nodeProvider.addresses.getAddressesAddressBalance(signer.address)
    expect(BigInt(balanceAfterPayNoGas.balance)).toBe(initialBalance)

    const payGasResult = await PayGas.execute(signer, { initialFields: { gaslessContract: contractInstance.contractId } })
    const balanceAfterPayGas = await nodeProvider.addresses.getAddressesAddressBalance(signer.address)
    const gasFee = BigInt(payGasResult.gasAmount) * BigInt(payGasResult.gasPrice)
    expect(BigInt(balanceAfterPayGas.balance)).toBe(initialBalance - gasFee)
  }, 20000)
})
