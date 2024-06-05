import { ConnectModal } from './ConnectModal'
import { AlephiumConnectProvider, ConnectSettingProvider } from '@alephium/web3-react'

export const CustomProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AlephiumConnectProvider network='mainnet'>
      <ConnectSettingProvider>
        {children}
        <ConnectModal/>
      </ConnectSettingProvider>
    </AlephiumConnectProvider>
  )
}
