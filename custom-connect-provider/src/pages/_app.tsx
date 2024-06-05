import React from 'react'
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { CustomProvider } from '@/components/CustomProvider'

export default function App({ Component, pageProps }: AppProps) {

  return (
    <CustomProvider>
      <Component {...pageProps} />
    </CustomProvider>
  )
}
