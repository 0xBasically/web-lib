import {chains} from '@yearn-finance/web-lib/utils/web3/chains';

import {useChainID} from './useChainID';

import type {TChain} from '@yearn-finance/web-lib/utils/web3/chains';
import type {TNDict} from '../utils/types';

type TUseChainReturn = {
	get: (chainID: number) => TChain | null;
	getCurrent: () => TChain | null;
	getAll: () => TNDict<TChain>;
}

/* 🔵 - Yearn Finance ******************************************************
** This hook can be used to grab details about a network.
** It will return details of the network.
**************************************************************************/
export function useChain(): TUseChainReturn {
	const {safeChainID} = useChainID();
	
	return {
		get: (chainID: number): TChain | null => {
			return chains[chainID] ? chains[chainID] : null;
		},
		getCurrent: (): TChain | null => {
			return chains[safeChainID] ? chains[safeChainID] : null;
		},
		getAll: (): TNDict<TChain>  => chains
	};
}
