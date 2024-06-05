import { tokenFaucetConfig } from '@/services/utils'
import { ConnectModal } from './ConnectModal'
import { AlephiumConnectProvider, ConnectSettingProvider } from '@alephium/web3-react'

export const CustomProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <AlephiumConnectProvider network={tokenFaucetConfig.network} addressGroup={tokenFaucetConfig.groupIndex}>
      <ConnectSettingProvider>
        {children}
        <ConnectModal/>
      </ConnectSettingProvider>
    </AlephiumConnectProvider>
  )
}
