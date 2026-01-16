'use client'

import React from 'react'
import Head from 'next/head'
import styles from '@/styles/Home.module.css'
import { TokenDapp } from './TokenDapp'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import { tokenFaucetConfig } from '@/services/utils'

export default function Home() {
  const { connectionStatus } = useWallet()

  return (
    <>
      <div className={styles.container}>
        <AlephiumConnectButton />

        {connectionStatus === 'connected' && (
          <TokenDapp config={tokenFaucetConfig} />
        )}
      </div>
    </>
  )
}
