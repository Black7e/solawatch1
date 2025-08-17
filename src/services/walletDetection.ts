import { Connection, PublicKey, ConfirmedSignatureInfo } from "@solana/web3.js";
import { telegramBot, AlertMessage } from "./telegramBot";

export interface WalletMonitorConfig {
	walletAddress: string;
	nickname?: string;
	alertTypes: Set<AlertType>;
	thresholds: {
		minTransactionAmount?: number; // In SOL
		minTokenAmount?: number; // In USD
		largeTransactionThreshold?: number; // In USD
	};
	enabled: boolean;
}

export type AlertType =
	| "all_transactions"
	| "large_transactions"
	| "token_swaps"
	| "nft_transfers"
	| "incoming_only"
	| "outgoing_only"
	| "new_tokens";

export interface DetectedActivity {
	wallet: string;
	signature: string;
	type: "transfer" | "swap" | "nft" | "unknown";
	direction: "incoming" | "outgoing" | "self";
	amount?: number;
	token?: string;
	tokenAddress?: string;
	fromAddress?: string;
	toAddress?: string;
	timestamp: number;
	fee?: number;
}

export class WalletDetectionService {
	private connection: Connection;
	private monitoredWallets: Map<string, WalletMonitorConfig> = new Map();
	private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
	private lastSignatures: Map<string, string> = new Map();
	private isMonitoring: boolean = false;
	private alertQueue: AlertMessage[] = [];
	private alertBatchTimer: NodeJS.Timeout | null = null;

	constructor(connection: Connection) {
		this.connection = connection;
		this.loadMonitoredWallets();
	}

	/**
	 * Load monitored wallets from localStorage
	 */
	private loadMonitoredWallets(): void {
		try {
			const stored = localStorage.getItem("monitored_wallets");
			if (stored) {
				const wallets = JSON.parse(stored);
				wallets.forEach((config: any) => {
					config.alertTypes = new Set(config.alertTypes);
					this.monitoredWallets.set(config.walletAddress, config);
				});
			}
		} catch (error) {
			console.error("Failed to load monitored wallets:", error);
		}
	}

	/**
	 * Save monitored wallets to localStorage
	 */
	private saveMonitoredWallets(): void {
		try {
			const wallets = Array.from(this.monitoredWallets.values()).map(
				(config) => ({
					...config,
					alertTypes: Array.from(config.alertTypes),
				})
			);
			localStorage.setItem("monitored_wallets", JSON.stringify(wallets));
		} catch (error) {
			console.error("Failed to save monitored wallets:", error);
		}
	}

	/**
	 * Add a wallet to monitor
	 */
	public addWallet(config: WalletMonitorConfig): void {
		// Validate wallet address
		try {
			new PublicKey(config.walletAddress);
		} catch {
			throw new Error("Invalid wallet address");
		}

		this.monitoredWallets.set(config.walletAddress, config);
		this.saveMonitoredWallets();

		if (config.enabled && this.isMonitoring) {
			this.startMonitoringWallet(config.walletAddress);
		}

		// Send notification
		telegramBot.sendAlert({
			type: "new_wallet",
			title: "New Wallet Added for Monitoring",
			message: `Started monitoring wallet ${
				config.nickname || config.walletAddress
			}`,
			wallet: config.walletAddress,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Remove a wallet from monitoring
	 */
	public removeWallet(walletAddress: string): void {
		this.stopMonitoringWallet(walletAddress);
		this.monitoredWallets.delete(walletAddress);
		this.saveMonitoredWallets();
	}

	/**
	 * Update wallet configuration
	 */
	public updateWallet(
		walletAddress: string,
		config: Partial<WalletMonitorConfig>
	): void {
		const existing = this.monitoredWallets.get(walletAddress);
		if (!existing) {
			throw new Error("Wallet not found");
		}

		const updated = { ...existing, ...config };
		this.monitoredWallets.set(walletAddress, updated);
		this.saveMonitoredWallets();

		// Restart monitoring if needed
		if (this.isMonitoring) {
			this.stopMonitoringWallet(walletAddress);
			if (updated.enabled) {
				this.startMonitoringWallet(walletAddress);
			}
		}
	}

	/**
	 * Get all monitored wallets
	 */
	public getMonitoredWallets(): WalletMonitorConfig[] {
		return Array.from(this.monitoredWallets.values());
	}

	/**
	 * Start monitoring all enabled wallets
	 */
	public startMonitoring(): void {
		if (this.isMonitoring) return;

		this.isMonitoring = true;

		// Start monitoring each enabled wallet
		this.monitoredWallets.forEach((config, address) => {
			if (config.enabled) {
				this.startMonitoringWallet(address);
			}
		});

		// Send status update
		const enabledWallets = Array.from(this.monitoredWallets.values())
			.filter((w) => w.enabled)
			.map((w) => w.walletAddress);

		telegramBot.sendMonitoringStatus(enabledWallets, "started");
	}

	/**
	 * Stop monitoring all wallets
	 */
	public stopMonitoring(): void {
		if (!this.isMonitoring) return;

		this.isMonitoring = false;

		// Stop all polling intervals
		this.pollingIntervals.forEach((interval) => clearInterval(interval));
		this.pollingIntervals.clear();

		// Clear alert batch timer
		if (this.alertBatchTimer) {
			clearTimeout(this.alertBatchTimer);
			this.alertBatchTimer = null;
		}

		// Send remaining alerts
		this.flushAlertQueue();

		// Send status update
		const wallets = Array.from(this.monitoredWallets.keys());
		telegramBot.sendMonitoringStatus(wallets, "stopped");
	}

	/**
	 * Start monitoring a specific wallet
	 */
	private startMonitoringWallet(walletAddress: string): void {
		// Check transactions every 10 seconds
		const interval = setInterval(() => {
			this.checkWalletActivity(walletAddress);
		}, 10000);

		this.pollingIntervals.set(walletAddress, interval);

		// Do an immediate check
		this.checkWalletActivity(walletAddress);
	}

	/**
	 * Stop monitoring a specific wallet
	 */
	private stopMonitoringWallet(walletAddress: string): void {
		const interval = this.pollingIntervals.get(walletAddress);
		if (interval) {
			clearInterval(interval);
			this.pollingIntervals.delete(walletAddress);
		}
	}

	/**
	 * Check wallet for new activity
	 */
	private async checkWalletActivity(walletAddress: string): Promise<void> {
		try {
			const config = this.monitoredWallets.get(walletAddress);
			if (!config || !config.enabled) return;

			const pubkey = new PublicKey(walletAddress);

			// Get recent signatures
			const signatures = await this.connection.getSignaturesForAddress(
				pubkey,
				{
					limit: 10,
				}
			);

			if (signatures.length === 0) return;

			// Check if we've seen the latest signature
			const lastSeen = this.lastSignatures.get(walletAddress);
			const newSignatures = lastSeen
				? signatures.filter((sig) => sig.signature !== lastSeen)
				: signatures.slice(0, 3); // Only process last 3 on first run

			if (newSignatures.length === 0) return;

			// Update last seen signature
			this.lastSignatures.set(walletAddress, signatures[0].signature);

			// Process new transactions
			for (const sigInfo of newSignatures) {
				const activity = await this.analyzeTransaction(
					sigInfo,
					walletAddress
				);
				if (activity && this.shouldAlert(activity, config)) {
					this.queueAlert(activity, config);
				}
			}
		} catch (error) {
			console.error(`Error checking wallet ${walletAddress}:`, error);
		}
	}

	/**
	 * Analyze a transaction to detect activity type
	 */
	private async analyzeTransaction(
		sigInfo: ConfirmedSignatureInfo,
		walletAddress: string
	): Promise<DetectedActivity | null> {
		try {
			const tx = await this.connection.getParsedTransaction(
				sigInfo.signature,
				{
					maxSupportedTransactionVersion: 0,
				}
			);

			if (!tx || !tx.meta) return null;

			const activity: DetectedActivity = {
				wallet: walletAddress,
				signature: sigInfo.signature,
				type: "unknown",
				direction: "self",
				timestamp: (sigInfo.blockTime || 0) * 1000,
				fee: tx.meta.fee / 1e9, // Convert lamports to SOL
			};

			// Analyze pre and post balances to detect transfers
			const accountKeys = tx.transaction.message.accountKeys;
			const walletIndex = accountKeys.findIndex(
				(key) => key.pubkey.toString() === walletAddress
			);

			if (walletIndex !== -1) {
				const preBalance = tx.meta.preBalances[walletIndex] / 1e9;
				const postBalance = tx.meta.postBalances[walletIndex] / 1e9;
				const balanceChange = postBalance - preBalance;

				if (Math.abs(balanceChange) > 0.0001) {
					// Ignore tiny changes
					activity.amount = Math.abs(balanceChange);
					activity.token = "SOL";
					activity.direction = balanceChange > 0 ? "incoming" : "outgoing";
					activity.type = "transfer";
				}
			}

			// Check for token transfers in instructions
			const instructions = tx.transaction.message.instructions;
			for (const instruction of instructions) {
				if ("parsed" in instruction && instruction.parsed) {
					const { type, info } = instruction.parsed;

					if (type === "transfer" || type === "transferChecked") {
						activity.type = "transfer";
						if (info.source === walletAddress) {
							activity.direction = "outgoing";
							activity.toAddress = info.destination;
						} else if (info.destination === walletAddress) {
							activity.direction = "incoming";
							activity.fromAddress = info.source;
						}
					} else if (type === "swap") {
						activity.type = "swap";
					}
				}
			}

			// Check for NFT transfers (would need more complex logic)
			const hasNftTransfer = instructions.some(
				(inst) =>
					"programId" in inst &&
					(inst.programId.toString() ===
						"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" ||
						inst.programId.toString() ===
							"metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
			);

			if (hasNftTransfer && activity.type === "transfer") {
				activity.type = "nft";
			}

			return activity;
		} catch (error) {
			console.error("Error analyzing transaction:", error);
			return null;
		}
	}

	/**
	 * Check if an activity should trigger an alert
	 */
	private shouldAlert(
		activity: DetectedActivity,
		config: WalletMonitorConfig
	): boolean {
		const { alertTypes, thresholds } = config;

		// Check if alert type is enabled
		if (alertTypes.has("all_transactions")) return true;

		if (alertTypes.has("incoming_only") && activity.direction !== "incoming")
			return false;
		if (alertTypes.has("outgoing_only") && activity.direction !== "outgoing")
			return false;

		// Check transaction type
		if (activity.type === "swap" && !alertTypes.has("token_swaps"))
			return false;
		if (activity.type === "nft" && !alertTypes.has("nft_transfers"))
			return false;

		// Check amount thresholds
		if (thresholds.minTransactionAmount && activity.amount) {
			if (
				activity.token === "SOL" &&
				activity.amount < thresholds.minTransactionAmount
			) {
				return false;
			}
		}

		if (
			alertTypes.has("large_transactions") &&
			thresholds.largeTransactionThreshold
		) {
			// For simplicity, assume 1 SOL = $100 (you'd want to fetch real prices)
			const valueInUsd = activity.amount ? activity.amount * 100 : 0;
			if (valueInUsd < thresholds.largeTransactionThreshold) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Queue an alert for batching
	 */
	private queueAlert(
		activity: DetectedActivity,
		config: WalletMonitorConfig
	): void {
		const alert: AlertMessage = {
			type: this.getAlertType(activity),
			title: this.getAlertTitle(activity, config),
			message: this.getAlertMessage(activity),
			wallet: activity.wallet,
			transaction: activity.signature,
			amount: activity.amount?.toFixed(4),
			token: activity.token,
			timestamp: new Date(activity.timestamp).toISOString(),
			priority: this.getAlertPriority(activity),
		};

		this.alertQueue.push(alert);

		// Set up batch timer if not already set
		if (!this.alertBatchTimer) {
			this.alertBatchTimer = setTimeout(() => {
				this.flushAlertQueue();
			}, 5000); // Send alerts every 5 seconds
		}
	}

	/**
	 * Send all queued alerts
	 */
	private async flushAlertQueue(): Promise<void> {
		if (this.alertQueue.length === 0) return;

		const alerts = [...this.alertQueue];
		this.alertQueue = [];
		this.alertBatchTimer = null;

		if (alerts.length === 1) {
			// Send single alert
			await telegramBot.sendAlert(alerts[0]);
		} else {
			// Send bulk alert
			await telegramBot.sendBulkAlert(
				"Wallet Activity Detected",
				alerts,
				`${alerts.length} new transactions detected`
			);
		}
	}

	/**
	 * Get alert type from activity
	 */
	private getAlertType(activity: DetectedActivity): AlertMessage["type"] {
		switch (activity.type) {
			case "swap":
				return "token_swap";
			case "nft":
				return "nft_transfer";
			case "transfer":
				return activity.amount && activity.amount > 100
					? "large_transaction"
					: "wallet_activity";
			default:
				return "wallet_activity";
		}
	}

	/**
	 * Get alert title from activity
	 */
	private getAlertTitle(
		activity: DetectedActivity,
		config: WalletMonitorConfig
	): string {
		const walletName =
			config.nickname || `Wallet ${activity.wallet.slice(0, 8)}...`;
		const direction =
			activity.direction === "incoming"
				? "⬇️ Received"
				: activity.direction === "outgoing"
				? "⬆️ Sent"
				: "🔄";

		switch (activity.type) {
			case "swap":
				return `${walletName}: Token Swap`;
			case "nft":
				return `${walletName}: NFT Transfer`;
			case "transfer":
				return `${walletName}: ${direction} ${activity.token || "Token"}`;
			default:
				return `${walletName}: Transaction Detected`;
		}
	}

	/**
	 * Get alert message from activity
	 */
	private getAlertMessage(activity: DetectedActivity): string {
		const messages: string[] = [];

		if (activity.direction === "incoming" && activity.fromAddress) {
			messages.push(`From: ${activity.fromAddress.slice(0, 8)}...`);
		} else if (activity.direction === "outgoing" && activity.toAddress) {
			messages.push(`To: ${activity.toAddress.slice(0, 8)}...`);
		}

		if (activity.fee) {
			messages.push(`Fee: ${activity.fee.toFixed(6)} SOL`);
		}

		return messages.join("\n") || "Transaction detected";
	}

	/**
	 * Get alert priority based on activity
	 */
	private getAlertPriority(
		activity: DetectedActivity
	): AlertMessage["priority"] {
		if (!activity.amount) return "low";

		const valueInUsd =
			activity.token === "SOL" ? activity.amount * 100 : activity.amount;

		if (valueInUsd > 10000) return "critical";
		if (valueInUsd > 1000) return "high";
		if (valueInUsd > 100) return "medium";
		return "low";
	}

	/**
	 * Detect new wallet creation
	 */
	public async detectNewWallet(signature: string): Promise<string | null> {
		try {
			const tx = await this.connection.getParsedTransaction(signature, {
				maxSupportedTransactionVersion: 0,
			});

			if (!tx || !tx.meta) return null;

			// Look for system program create account instruction
			const instructions = tx.transaction.message.instructions;
			for (const instruction of instructions) {
				if (
					"parsed" in instruction &&
					instruction.programId.toString() ===
						"11111111111111111111111111111111" &&
					instruction.parsed.type === "createAccount"
				) {
					const newAccount = instruction.parsed.info.newAccount;

					// Send alert for new wallet
					await telegramBot.sendAlert({
						type: "new_wallet",
						title: "New Wallet Detected",
						message: "A new wallet has been created on Solana",
						wallet: newAccount,
						transaction: signature,
						timestamp: new Date().toISOString(),
						priority: "medium",
					});

					return newAccount;
				}
			}

			return null;
		} catch (error) {
			console.error("Error detecting new wallet:", error);
			return null;
		}
	}

	/**
	 * Get wallet statistics
	 */
	public async getWalletStats(walletAddress: string): Promise<{
		totalTransactions: number;
		balance: number;
		tokenCount: number;
		lastActivity: Date | null;
	}> {
		try {
			const pubkey = new PublicKey(walletAddress);

			// Get balance
			const balance = (await this.connection.getBalance(pubkey)) / 1e9;

			// Get recent signatures for transaction count
			const signatures = await this.connection.getSignaturesForAddress(
				pubkey,
				{
					limit: 1000,
				}
			);

			// Get token accounts
			const tokenAccounts =
				await this.connection.getParsedTokenAccountsByOwner(pubkey, {
					programId: new PublicKey(
						"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
					),
				});

			const lastActivity =
				signatures.length > 0 && signatures[0].blockTime
					? new Date(signatures[0].blockTime * 1000)
					: null;

			return {
				totalTransactions: signatures.length,
				balance,
				tokenCount: tokenAccounts.value.length,
				lastActivity,
			};
		} catch (error) {
			console.error("Error getting wallet stats:", error);
			return {
				totalTransactions: 0,
				balance: 0,
				tokenCount: 0,
				lastActivity: null,
			};
		}
	}
}

// Export singleton instance
let walletDetectionInstance: WalletDetectionService | null = null;

export function getWalletDetectionService(
	connection: Connection
): WalletDetectionService {
	if (!walletDetectionInstance) {
		walletDetectionInstance = new WalletDetectionService(connection);
	}
	return walletDetectionInstance;
}
