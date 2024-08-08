import { waitForTxConfirmation, web3 } from '@alephium/web3';
import React, { useCallback, useEffect, useState } from 'react';
import { loadDeployments } from '../../artifacts/ts/deployments'
import { useWallet } from '@alephium/web3-react';
import { RandomValueFetcherTypes } from 'artifacts/ts';

const RandomValueUpdater = () => {
  web3.setCurrentNodeProvider('https://node.testnet.alephium.org')
  const randomValueFetcher = loadDeployments('testnet').contracts.RandomValueFetcher.contractInstance
  const [value, setValue] = useState<RandomValueFetcherTypes.Fields>()
  const [txId, setTxId] = useState('')
  const wallet = useWallet()

  useEffect(() => {
    console.log('fetching randomness')
    randomValueFetcher.fetchState().then((state) => setValue(state.fields))
  }, [txId])

  const fetchRandomValue = useCallback(async () => {
    if (wallet.connectionStatus === 'connected') {
      const tx = await randomValueFetcher.transact.update({ signer: wallet.signer })
      await waitForTxConfirmation(tx.txId, 1, 4000)
      console.log(tx.txId)
      setTxId(tx.txId)
    }
  }, [randomValueFetcher])

  return (
    <div>
      {value !== undefined
        ? <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Random Value</h1>
            <div>
              <p>Latest round: {value.lastRound.toString()}</p>
              <p>Randomness: {value.value.randomness}</p>
              <p>Signature: {value.value.signature}</p>
              <p>Prev signature: {value.value.previousSignature}</p>
            </div>
            <button onClick={fetchRandomValue} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
              Update Random Value
            </button>
          </div>
        : <div></div>}
    </div>
  )
};

export default RandomValueUpdater;