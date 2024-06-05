import React  from 'react'

import { ConnectModal } from './ConnectModal'
import { AlephiumConnectProvider, ConnectSettingProvider } from '@alephium/web3-react'

const network = 'mainnet'
const addressGroup: number | undefined = 0

export const CustomProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AlephiumConnectProvider network={network} addressGroup={addressGroup}>
      <ConnectSettingProvider>
        {children}
        <ConnectModal/>
      </ConnectSettingProvider>
    </AlephiumConnectProvider>
  )
}
