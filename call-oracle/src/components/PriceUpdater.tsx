import { waitForTxConfirmation, web3 } from '@alephium/web3';
import React, { useCallback, useEffect, useState } from 'react';
import { loadDeployments } from '../../artifacts/ts/deployments'
import { useWallet } from '@alephium/web3-react';
import { PriceFetcherInstance } from 'artifacts/ts';

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

const PriceUpdater = () => {
  web3.setCurrentNodeProvider('https://node.mainnet.alephium.org')
  const priceFetcher = loadDeployments('mainnet').contracts.PriceFetcher.contractInstance
  const [prices, setPrices] = useState({ BTC: 0, ETH: 0, USDC: 0, ALPH: 0, AYIN: 0 });
  const [txId, setTxId] = useState('')
  const wallet = useWallet()

  useEffect(() => {
    console.log('fetching prices')
    getPrices(priceFetcher).then((newPrices) => setPrices(newPrices))
  }, [txId])

  const fetchPrices = useCallback(async () => {
    if (wallet.connectionStatus === 'connected') {
      const tx = await priceFetcher.transact.update({ signer: wallet.signer })
      await waitForTxConfirmation(tx.txId, 1, 4000)
      console.log(tx.txId)
      setTxId(tx.txId)
    }
  }, [priceFetcher])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Cryptocurrency Prices</h1>
      <div>
        <h2>BTC: ${prices.BTC}</h2>
        <h2>ETH: ${prices.ETH}</h2>
        <h2>USDC: ${prices.USDC}</h2>
        <h2>ALPH: ${prices.ALPH}</h2>
        <h2>AYIN: ${prices.AYIN}</h2>
      </div>
      <button onClick={fetchPrices} style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px' }}>
        Update Prices
      </button>
    </div>
  );
};

export default PriceUpdater;