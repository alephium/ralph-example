import React from 'react'
import styles from '@/styles/Home.module.css'
import { AlephiumConnectButton, useWallet } from '@alephium/web3-react'
import OracleUpdater from '@/components/OracleUpdater'

export default function Home() {
  const { connectionStatus } = useWallet()

  return (
    <>
      <div className={styles.container}>
        <AlephiumConnectButton />
        {connectionStatus === 'connected' && (
          <OracleUpdater />
        )}
      </div>
    </>
  )
}
