import { Configuration } from '@alephium/cli'

export default {
    networks: {
        devnet: {
            nodeUrl: 'http://127.0.0.1:22973',
            privateKeys: ['a642942e67258589cd2b1822c631506632db5a12aabcf413604e785300d762a5'],
            apiKey: '0000000000000000000000000000000000000000000000000000000000000000'
        }
    },
    compilerOptions: {
        errorOnWarnings: false,
        ignoreUnusedConstantsWarnings: true
    }
} as Configuration