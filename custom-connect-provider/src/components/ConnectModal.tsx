import React, { useCallback, useEffect, useState } from 'react';
import { useConnect, useConnectSettingContext, useWallet } from '@alephium/web3-react';
import { Button, Modal, Box } from '@mui/material';

export function ConnectModal() {
  const [opened, setOpened] = useState(false)
  const [connectClicked, setConnectClicked] = useState(false)
  const context = useConnectSettingContext()

  const { connect, disconnect } = useConnect()
  const { connectionStatus } = useWallet()

  useEffect(() => {
    if (connectClicked && opened) {
      setConnectClicked(false)
      connect().then(() => {
        setOpened(false)
      })
    }
  }, [connectClicked, opened, setConnectClicked, connect, setOpened])

  const onConnect = useCallback((id: 'injected' | 'walletConnect' | 'desktopWallet') => {
    context.setConnectorId(id)
    setConnectClicked(true)
  }, [context, setConnectClicked])

  const onDisconnect = useCallback(async () => {
    await disconnect()
  }, [disconnect])

  return (
    <div>
      {connectionStatus === 'connected' ? (
        <div>
          <Button variant="contained" onClick={onDisconnect}>Disconnect</Button>
        </div>
      ) : (
        <div>
          <Button variant="contained" onClick={() => setOpened(true)}>Connect</Button>
          <Modal
            open={opened}
            onClose={() => setOpened(false)}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
              <Button variant="contained" onClick={() => onConnect('injected')}>Extension Wallet</Button>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => onConnect('walletConnect')}>Wallet Connect</Button>
              <Button variant="contained" sx={{ mt: 2 }} onClick={() => onConnect('desktopWallet')}>Desktop Wallet</Button>
            </Box>
          </Modal>
        </div>
      )}
    </div>
  );
}
