import { Configuration } from '@alephium/cli'

export default {
    networks: {
        devnet: {
            nodeUrl: 'http://localhost:22973',
            privateKeys: ['a642942e67258589cd2b1822c631506632db5a12aabcf413604e785300d762a5'],
            settings: {
                groupIndex: 0,
                numberOfNodes: 4
            }
        }
    },
    artifacts: {
        typescript: true,
        project: "."
    }
} as Configuration