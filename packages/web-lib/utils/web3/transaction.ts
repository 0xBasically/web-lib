
import {yToast} from '@yearn-finance/web-lib/components/yToast';

import type {ethers} from 'ethers';
import type React from 'react';

const		timeout = 3000;
const		defaultTxStatus = {none: true, pending: false, success: false, error: false};
const		errorTxStatus = {none: false, pending: false, success: false, error: true};
const		pendingTxStatus = {none: false, pending: true, success: false, error: false};
const		successTxStatus = {none: false, pending: false, success: true, error: false};

export type	TTxStatus = {none: boolean, pending: boolean, success: boolean, error: boolean}
export type TTxResponse = {isSuccessful: boolean, receipt?: ethers.providers.TransactionReceipt, error?: Error};

class Transaction {
	provider: ethers.providers.Web3Provider | ethers.providers.Provider;
	onStatus: React.Dispatch<React.SetStateAction<TTxStatus>>;
	options?: {shouldIgnoreSuccessTxStatusChange: boolean};
	txArgs?: unknown[];
	funcCall: (...props: never) => Promise<TTxResponse>;
	successCall?: (receipt?: ethers.providers.TransactionReceipt) => Promise<void>;

	constructor(
		provider: ethers.providers.Web3Provider | ethers.providers.Provider,
		funcCall: (...props: never) => Promise<TTxResponse>,
		onStatus: React.Dispatch<React.SetStateAction<TTxStatus>>,
		options?: {shouldIgnoreSuccessTxStatusChange: boolean}
	) {
		this.provider = provider;
		this.funcCall = funcCall;
		this.onStatus = onStatus;
		this.options = options;
	}

	populate(...txArgs: unknown[]): Transaction {
		this.txArgs = txArgs;
		return this;
	}

	onSuccess(onSuccess: (receipt?: ethers.providers.TransactionReceipt) => Promise<void>): Transaction {
		this.successCall = onSuccess;
		return this;
	}

	async perform(): Promise<TTxResponse> {
		const {toast} = yToast();

		this.onStatus(pendingTxStatus);
		try {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const	{isSuccessful, receipt} = await this.funcCall(this.provider, ...this.txArgs);
			if (isSuccessful) {
				if (this.successCall && receipt) {
					await this.successCall(receipt);
				}
				toast({content: 'Transaction successful', type: 'success'});
				if (this?.options?.shouldIgnoreSuccessTxStatusChange) {
					return {isSuccessful, receipt};
				}
				this.onStatus(successTxStatus);
				setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
				return ({isSuccessful, receipt});
			}
			toast({content: 'Transaction failed', type: 'error'});
			this.onStatus(errorTxStatus);
			setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
			return ({isSuccessful: false});

		} catch(error) {
			console.error(error);
			if (((error as any)?.message || '').includes('User declined transaction')) {
				toast({content: 'User declined transaction', type: 'error'});
			} else {
				toast({content: 'Transaction failed', type: 'error'});
			}
			this.onStatus(errorTxStatus);
			setTimeout((): void => this.onStatus(defaultTxStatus), timeout);
			return ({isSuccessful: false});
		}
	}
}

async function handleTx(txPromise: Promise<ethers.providers.TransactionResponse>): Promise<TTxResponse> {
	try {
		const tx = await txPromise;
		const receipt = await tx.wait();
		if (receipt.status === 0) {
			console.error('Fail to perform transaction');
			return {isSuccessful: false};
		}
		return {isSuccessful: true, receipt};
	} catch (error) {
		console.error(error);
		return {isSuccessful: false, error: error as Error};
	}
}

export {
	defaultTxStatus, handleTx,
	Transaction
};
