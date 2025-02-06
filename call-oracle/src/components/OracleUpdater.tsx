import { waitForTxConfirmation, web3 } from '@alephium/web3';
import React, { useCallback, useEffect, useState } from 'react';
import { loadDeployments } from '../../artifacts/ts/deployments'
import { useWallet } from '@alephium/web3-react';
import { PriceFetcherInstance, RandomnessFetcher, RandomnessFetcherInstance } from 'artifacts/ts';

const DECIMALS = 10 ** 8

async function getPrices(priceFetcher: PriceFetcherInstance): Promise<{ BTC: number, ETH: number, USDC: number, ALPH: number, AYIN: number }> {
  const state = await priceFetcher.fetchState()
  return {
    BTC: Number(state.fields.btcPrice) / DECIMALS,
    ETH: Number(state.fields.ethPrice) / DECIMALS,
    USDC: Number(state.fields.usdcPrice) / DECIMALS,
    ALPH: Number(state.fields.alphPrice) / DECIMALS,
    AYIN: Number(state.fields.ayinPrice) / DECIMALS,
  }
}

async function getRandomness(randomnessFetcher: RandomnessFetcherInstance): Promise<{randomness: string, signature: string, round: number}> {
  const state = await randomnessFetcher.fetchState()
  return {
    randomness: state.fields.randomValue.randomness,
    signature: state.fields.randomValue.signature,
    round: Number(state.fields.randomValue.round)
  }
}

const OracleUpdater = () => {
  web3.setCurrentNodeProvider('https://node.testnet.alephium.org')
  const priceFetcher = loadDeployments('testnet').contracts.PriceFetcher.contractInstance
  const randomnessFetcher = loadDeployments('testnet').contracts.RandomnessFetcher.contractInstance
  const [prices, setPrices] = useState({ BTC: 0, ETH: 0, USDC: 0, ALPH: 0, AYIN: 0 });
  const [randomness, setRandomness] = useState({randomness: '', signature: '', round: 0});
  const [txId, setTxId] = useState('')
  const wallet = useWallet()

  useEffect(() => {
    console.log('fetching prices')
    getPrices(priceFetcher).then((newPrices) => setPrices(newPrices))
    getRandomness(randomnessFetcher).then((newRandomness) => setRandomness(newRandomness))
  }, [txId])

  const fetchPrices = useCallback(async () => {
    if (wallet.connectionStatus === 'connected') {
      const tx = await priceFetcher.transact.update({ signer: wallet.signer })
      await waitForTxConfirmation(tx.txId, 1, 4000)
      console.log(tx.txId)
      setTxId(tx.txId)
    }
  }, [priceFetcher])

  const fetchRandomness = useCallback(async () => {
    if (wallet.connectionStatus === 'connected') {
      const tx = await randomnessFetcher.transact.update({ signer: wallet.signer })
      await waitForTxConfirmation(tx.txId, 1, 4000)
      console.log(tx.txId)
      setTxId(tx.txId)
    }
  }, [])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Cryptocurrency Prices</h1>
      <div>
        <table style={{ margin: 'auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Asset</th>
              <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Price (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>BTC</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${prices.BTC}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>ETH</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${prices.ETH}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>USDC</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${prices.USDC}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>ALPH</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${prices.ALPH}</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>AYIN</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>${prices.AYIN}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button onClick={fetchPrices} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
        Update Prices
      </button>

      <div style={{ marginTop: '40px' }}>
        <h1>Randomness</h1>
        <div>
          <table style={{ margin: 'auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Field</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Value</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{randomness.randomness}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Round</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{randomness.round}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>Signature</td>
                <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{randomness.signature}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button onClick={fetchRandomness} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
          Update Random Number
        </button>
      </div>
    </div>
  );
};

export default OracleUpdater;