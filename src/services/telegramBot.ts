import axios from "axios";

export interface TelegramConfig {
	botToken: string;
	chatId: string;
}

export interface AlertMessage {
	type:
		| "wallet_activity"
		| "new_wallet"
		| "large_transaction"
		| "token_swap"
		| "nft_transfer";
	title: string;
	message: string;
	wallet?: string;
	transaction?: string;
	amount?: string;
	token?: string;
	timestamp?: string;
	priority?: "low" | "medium" | "high" | "critical";
}

export class TelegramBotService {
	private baseUrl = "https://api.telegram.org";
	private config: TelegramConfig;
	private isConfigured: boolean = false;

	constructor(config?: TelegramConfig) {
		if (config && config.botToken && config.chatId) {
			this.config = config;
			this.isConfigured = true;
		} else {
			// Try to get from environment variables
			const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
			const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

			if (botToken && chatId) {
				this.config = { botToken, chatId };
				this.isConfigured = true;
			} else {
				this.config = { botToken: "", chatId: "" };
				console.warn(
					"Telegram bot not configured. Please set VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID"
				);
			}
		}
	}

	/**
	 * Check if the bot is properly configured
	 */
	public isReady(): boolean {
		return this.isConfigured;
	}

	/**
	 * Update bot configuration
	 */
	public updateConfig(config: TelegramConfig): void {
		if (config.botToken && config.chatId) {
			this.config = config;
			this.isConfigured = true;
		}
	}

	/**
	 * Test bot connection and configuration
	 */
	public async testConnection(): Promise<boolean> {
		if (!this.isConfigured) {
			throw new Error("Telegram bot not configured");
		}

		try {
			const response = await axios.get(
				`${this.baseUrl}/bot${this.config.botToken}/getMe`
			);
			return response.data.ok === true;
		} catch (error) {
			console.error("Failed to test Telegram bot connection:", error);
			return false;
		}
	}

	/**
	 * Send a simple text message
	 */
	public async sendMessage(text: string): Promise<boolean> {
		if (!this.isConfigured) {
			console.warn("Telegram bot not configured, skipping message send");
			return false;
		}

		try {
			const response = await axios.post(
				`${this.baseUrl}/bot${this.config.botToken}/sendMessage`,
				{
					chat_id: this.config.chatId,
					text,
					parse_mode: "HTML",
				}
			);
			return response.data.ok === true;
		} catch (error) {
			console.error("Failed to send Telegram message:", error);
			return false;
		}
	}

	/**
	 * Send a formatted alert message
	 */
	public async sendAlert(alert: AlertMessage): Promise<boolean> {
		if (!this.isConfigured) {
			console.warn("Telegram bot not configured, skipping alert");
			return false;
		}

		const emoji = this.getAlertEmoji(alert.type, alert.priority);
		const priorityText = alert.priority
			? ` [${alert.priority.toUpperCase()}]`
			: "";

		let message = `${emoji} <b>${alert.title}</b>${priorityText}\n\n`;
		message += `${alert.message}\n`;

		if (alert.wallet) {
			const shortWallet = this.shortenAddress(alert.wallet);
			const explorerUrl = `https://solscan.io/account/${alert.wallet}`;
			message += `\n💼 Wallet: <a href="${explorerUrl}">${shortWallet}</a>`;
		}

		if (alert.transaction) {
			const shortTx = this.shortenAddress(alert.transaction);
			const txUrl = `https://solscan.io/tx/${alert.transaction}`;
			message += `\n📝 Transaction: <a href="${txUrl}">${shortTx}</a>`;
		}

		if (alert.amount && alert.token) {
			message += `\n💰 Amount: ${alert.amount} ${alert.token}`;
		}

		if (alert.timestamp) {
			message += `\n⏰ Time: ${new Date(alert.timestamp).toLocaleString()}`;
		}

		return this.sendMessage(message);
	}

	/**
	 * Send a bulk alert for multiple events
	 */
	public async sendBulkAlert(
		title: string,
		alerts: AlertMessage[],
		summary?: string
	): Promise<boolean> {
		if (!this.isConfigured) {
			console.warn("Telegram bot not configured, skipping bulk alert");
			return false;
		}

		let message = `📊 <b>${title}</b>\n`;
		if (summary) {
			message += `${summary}\n`;
		}
		message += `\n<b>Events (${alerts.length}):</b>\n`;

		for (const alert of alerts.slice(0, 10)) {
			// Limit to 10 to avoid message being too long
			const emoji = this.getAlertEmoji(alert.type);
			message += `\n${emoji} ${alert.title}`;
			if (alert.amount && alert.token) {
				message += ` - ${alert.amount} ${alert.token}`;
			}
		}

		if (alerts.length > 10) {
			message += `\n\n... and ${alerts.length - 10} more events`;
		}

		return this.sendMessage(message);
	}

	/**
	 * Send a wallet monitoring status update
	 */
	public async sendMonitoringStatus(
		wallets: string[],
		status: "started" | "stopped" | "paused"
	): Promise<boolean> {
		const statusEmoji = {
			started: "🟢",
			stopped: "🔴",
			paused: "⏸️",
		};

		let message = `${statusEmoji[status]} <b>Wallet Monitoring ${
			status.charAt(0).toUpperCase() + status.slice(1)
		}</b>\n\n`;

		if (wallets.length > 0) {
			message += `<b>Monitored Wallets (${wallets.length}):</b>\n`;
			for (const wallet of wallets.slice(0, 5)) {
				const shortWallet = this.shortenAddress(wallet);
				const explorerUrl = `https://solscan.io/account/${wallet}`;
				message += `• <a href="${explorerUrl}">${shortWallet}</a>\n`;
			}
			if (wallets.length > 5) {
				message += `... and ${wallets.length - 5} more\n`;
			}
		}

		return this.sendMessage(message);
	}

	/**
	 * Send a price alert
	 */
	public async sendPriceAlert(
		tokenSymbol: string,
		tokenAddress: string,
		currentPrice: number,
		targetPrice: number,
		condition: "above" | "below"
	): Promise<boolean> {
		const emoji = condition === "above" ? "📈" : "📉";
		const explorerUrl = `https://solscan.io/token/${tokenAddress}`;

		const message =
			`${emoji} <b>Price Alert: ${tokenSymbol}</b>\n\n` +
			`Current Price: $${currentPrice.toFixed(6)}\n` +
			`Target Price: $${targetPrice.toFixed(6)}\n` +
			`Condition: Price went ${condition} target\n\n` +
			`<a href="${explorerUrl}">View Token</a>`;

		return this.sendMessage(message);
	}

	/**
	 * Send a formatted table (for leaderboards, rankings, etc.)
	 */
	public async sendTable(
		title: string,
		headers: string[],
		rows: string[][],
		footer?: string
	): Promise<boolean> {
		let message = `📊 <b>${title}</b>\n\n<pre>`;

		// Calculate column widths
		const columnWidths = headers.map((header, index) => {
			const maxLength = Math.max(
				header.length,
				...rows.map((row) => (row[index] || "").length)
			);
			return Math.min(maxLength, 15); // Cap at 15 characters
		});

		// Format headers
		const headerRow = headers
			.map((header, index) => header.padEnd(columnWidths[index]))
			.join(" | ");
		message += headerRow + "\n";
		message += "-".repeat(headerRow.length) + "\n";

		// Format rows
		for (const row of rows.slice(0, 15)) {
			// Limit to 15 rows
			const formattedRow = row
				.map((cell, index) => {
					const truncated =
						cell.length > columnWidths[index]
							? cell.substring(0, columnWidths[index] - 2) + ".."
							: cell;
					return truncated.padEnd(columnWidths[index]);
				})
				.join(" | ");
			message += formattedRow + "\n";
		}

		message += "</pre>";

		if (rows.length > 15) {
			message += `\n... and ${rows.length - 15} more rows`;
		}

		if (footer) {
			message += `\n\n${footer}`;
		}

		return this.sendMessage(message);
	}

	/**
	 * Helper to get emoji based on alert type
	 */
	private getAlertEmoji(
		type: AlertMessage["type"],
		priority?: AlertMessage["priority"]
	): string {
		if (priority === "critical") return "🚨";
		if (priority === "high") return "⚠️";

		const emojiMap = {
			wallet_activity: "👛",
			new_wallet: "🆕",
			large_transaction: "💸",
			token_swap: "🔄",
			nft_transfer: "🖼️",
		};
		return emojiMap[type] || "📢";
	}

	/**
	 * Helper to shorten addresses for display
	 */
	private shortenAddress(address: string): string {
		if (address.length <= 10) return address;
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	/**
	 * Format number with thousand separators
	 */
	public formatNumber(num: number): string {
		return new Intl.NumberFormat("en-US").format(num);
	}

	/**
	 * Format currency value
	 */
	public formatCurrency(value: number): string {
		if (value >= 1_000_000) {
			return `$${(value / 1_000_000).toFixed(2)}M`;
		} else if (value >= 1_000) {
			return `$${(value / 1_000).toFixed(2)}K`;
		} else {
			return `$${value.toFixed(2)}`;
		}
	}
}

// Export a singleton instance
export const telegramBot = new TelegramBotService();
