import { web3, ONE_ALPH } from '@alephium/web3'
import { getSigners } from '@alephium/web3-test'
import { Gasless, PayGas, PayNoGas } from '../artifacts/ts'

web3.setCurrentNodeProvider('http://127.0.0.1:22973', undefined, fetch)
const nodeProvider = web3.getCurrentNodeProvider()

describe('integration tests', () => {
  it('should pay gas fee when needed', async () => {
    const initialSignerBalance = ONE_ALPH * 100n
    const initialContractBalance = ONE_ALPH * 10n
    const [contractDeployer, signer] = await getSigners(2, initialSignerBalance, 0)
    const { contractInstance } = await Gasless.deploy(
      contractDeployer,
      {
        initialFields: {},
        initialAttoAlphAmount: initialContractBalance
      }
    )

    const payNoGasTxResult = await PayNoGas.execute({signer, initialFields: { gaslessContract: contractInstance.contractId } })
    const signerBalanceAfterPayNoGasTx = await nodeProvider.addresses.getAddressesAddressBalance(signer.address)
    expect(BigInt(signerBalanceAfterPayNoGasTx.balance)).toBe(initialSignerBalance)
    const contractBalanceAfterPayNoGasTx = await nodeProvider.addresses.getAddressesAddressBalance(contractInstance.address)
    const contractGasFee = BigInt(payNoGasTxResult.gasAmount) * BigInt(payNoGasTxResult.gasPrice)
    expect(BigInt(contractBalanceAfterPayNoGasTx.balance)).toBe(initialContractBalance - contractGasFee)

    const payGasResult = await PayGas.execute({signer, initialFields: { gaslessContract: contractInstance.contractId } })
    const signerBalanceAfterPayGasTx = await nodeProvider.addresses.getAddressesAddressBalance(signer.address)
    const signerGasFee = BigInt(payGasResult.gasAmount) * BigInt(payGasResult.gasPrice)
    expect(BigInt(signerBalanceAfterPayGasTx.balance)).toBe(initialSignerBalance - signerGasFee)
    const contractBalanceAfterPayGasTx = await nodeProvider.addresses.getAddressesAddressBalance(contractInstance.address)
    expect(BigInt(contractBalanceAfterPayGasTx.balance)).toBe(initialContractBalance - contractGasFee)
  }, 20000)
})
