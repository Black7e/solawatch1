import express from "express";
import axios from "axios";
import cors from "cors";
import NodeCache from "node-cache";
import dotenv from "dotenv";
import { Connection, PublicKey } from "@solana/web3.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const cache = new NodeCache();

// X OAuth Configuration
const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Solana Connection
const RPC_ENDPOINT =
	process.env.RPC_ENDPOINT || "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_ENDPOINT);

// Monitoring state
const monitoredWallets = new Map<string, any>();
const monitoringIntervals = new Map<string, NodeJS.Timeout>();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper: cache wrapper
async function cachedFetch<T>(
	key: string,
	ttl: number,
	fetcher: () => Promise<T>
): Promise<T> {
	const cached = cache.get<T>(key);
	if (cached) return cached;
	const data = await fetcher();
	cache.set(key, data, ttl);
	return data;
}

// Batch token metadata endpoint
app.get("/api/token-metadata", async (req, res) => {
	const mints = (req.query.mints as string)?.split(",").filter(Boolean) || [];
	if (mints.length === 0)
		return res.status(400).json({ error: "No mints provided" });
	try {
		const key = `metadata:${mints.sort().join(",")}`;
		const ttl = 60 * 60 * 24 * 7; // 7 days
		const data = await cachedFetch(key, ttl, async () => {
			// Example: Jupiter token list (replace with your preferred source)
			const resp = await axios.get("https://token.jup.ag/all");
			const allTokens = resp.data as any[];
			const result = mints.map(
				(mint) =>
					allTokens.find((t) => t.address === mint || t.mint === mint) ||
					null
			);
			return result;
		});
		res.json(data);
	} catch (err) {
		res.status(500).json({
			error: "Failed to fetch token metadata",
			details: err instanceof Error ? err.message : err,
		});
	}
});

// Batch token prices endpoint
app.get("/api/token-prices", async (req, res) => {
	const mints = (req.query.mints as string)?.split(",").filter(Boolean) || [];
	if (mints.length === 0)
		return res.status(400).json({ error: "No mints provided" });
	try {
		const key = `prices:${mints.sort().join(",")}`;
		const ttl = 60 * 5; // 5 minutes
		const data = await cachedFetch(key, ttl, async () => {
			// Example: Jupiter price API
			const resp = await axios.get(
				`https://price.jup.ag/v4/price?ids=${mints.join(",")}`
			);
			return resp.data?.data || {};
		});
		res.json(data);
	} catch (err) {
		res.status(500).json({
			error: "Failed to fetch token prices",
			details: err instanceof Error ? err.message : err,
		});
	}
});

// X OAuth token exchange proxy
app.post("/api/auth/x/token", async (req, res) => {
	try {
		const { code, code_verifier, redirect_uri } = req.body;

		if (!code || !code_verifier || !redirect_uri) {
			return res.status(400).json({ error: "Missing required parameters" });
		}

		if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
			return res.status(500).json({ error: "OAuth configuration missing" });
		}

		const response = await axios.post(
			"https://api.twitter.com/2/oauth2/token",
			new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri,
				code_verifier,
			}),
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${Buffer.from(
						`${X_CLIENT_ID}:${X_CLIENT_SECRET}`
					).toString("base64")}`,
				},
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("OAuth token exchange error:", error);
		if (axios.isAxiosError(error)) {
			res.status(error.response?.status || 500).json({
				error: "Token exchange failed",
				details: error.response?.data || error.message,
			});
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// X OAuth refresh token proxy
app.post("/api/auth/x/refresh", async (req, res) => {
	try {
		const { refresh_token } = req.body;

		if (!refresh_token) {
			return res.status(400).json({ error: "Missing refresh token" });
		}

		if (!X_CLIENT_ID || !X_CLIENT_SECRET) {
			return res.status(500).json({ error: "OAuth configuration missing" });
		}

		const response = await axios.post(
			"https://api.twitter.com/2/oauth2/token",
			new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token,
			}),
			{
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${Buffer.from(
						`${X_CLIENT_ID}:${X_CLIENT_SECRET}`
					).toString("base64")}`,
				},
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("OAuth refresh error:", error);
		if (axios.isAxiosError(error)) {
			res.status(error.response?.status || 500).json({
				error: "Token refresh failed",
				details: error.response?.data || error.message,
			});
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// X OAuth user information proxy
app.get("/api/auth/x/user", async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res
				.status(401)
				.json({ error: "Missing or invalid authorization header" });
		}

		const accessToken = authHeader.replace("Bearer ", "");

		const response = await axios.get(
			"https://api.twitter.com/2/users/me?user.fields=id,username,name,profile_image_url,verified,public_metrics",
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			}
		);

		res.json(response.data);
	} catch (error) {
		console.error("OAuth user fetch error:", error);
		if (axios.isAxiosError(error)) {
			res.status(error.response?.status || 500).json({
				error: "Failed to fetch user information",
				details: error.response?.data || error.message,
			});
		} else {
			res.status(500).json({ error: "Internal server error" });
		}
	}
});

// Telegram Bot Helper Functions
async function sendTelegramMessage(
	message: string,
	chatId?: string
): Promise<boolean> {
	if (!TELEGRAM_BOT_TOKEN) {
		console.warn("Telegram bot token not configured");
		return false;
	}

	const targetChatId = chatId || TELEGRAM_CHAT_ID;
	if (!targetChatId) {
		console.warn("Telegram chat ID not configured");
		return false;
	}

	try {
		const response = await axios.post(
			`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
			{
				chat_id: targetChatId,
				text: message,
				parse_mode: "HTML",
			}
		);
		return response.data.ok === true;
	} catch (error) {
		console.error("Failed to send Telegram message:", error);
		return false;
	}
}

async function checkWalletActivity(walletAddress: string): Promise<any[]> {
	try {
		const pubkey = new PublicKey(walletAddress);
		const signatures = await connection.getSignaturesForAddress(pubkey, {
			limit: 5,
		});
		return signatures;
	} catch (error) {
		console.error(`Error checking wallet ${walletAddress}:`, error);
		return [];
	}
}

// Wallet Monitoring Endpoints

// Start monitoring a wallet
app.post("/api/monitoring/wallets", async (req, res) => {
	try {
		const {
			walletAddress,
			nickname,
			alertTypes,
			thresholds,
			telegramChatId,
		} = req.body;

		if (!walletAddress) {
			return res.status(400).json({ error: "Wallet address is required" });
		}

		// Validate wallet address
		try {
			new PublicKey(walletAddress);
		} catch {
			return res.status(400).json({ error: "Invalid wallet address" });
		}

		// Store wallet configuration
		monitoredWallets.set(walletAddress, {
			walletAddress,
			nickname,
			alertTypes: alertTypes || ["all_transactions"],
			thresholds: thresholds || {},
			telegramChatId: telegramChatId || TELEGRAM_CHAT_ID,
			lastSignature: null,
			enabled: true,
		});

		// Start monitoring
		const interval = setInterval(async () => {
			const config = monitoredWallets.get(walletAddress);
			if (!config || !config.enabled) return;

			const signatures = await checkWalletActivity(walletAddress);
			if (signatures.length > 0) {
				const lastSeen = config.lastSignature;
				const newSignatures = lastSeen
					? signatures.filter((sig: any) => sig.signature !== lastSeen)
					: signatures.slice(0, 1);

				if (newSignatures.length > 0) {
					config.lastSignature = signatures[0].signature;
					monitoredWallets.set(walletAddress, config);

					// Send Telegram alert
					const message =
						`🔔 <b>Wallet Activity Detected</b>\n\n` +
						`Wallet: ${
							config.nickname || walletAddress.slice(0, 8) + "..."
						}\n` +
						`Transactions: ${newSignatures.length}\n` +
						`<a href="https://solscan.io/account/${walletAddress}">View on Solscan</a>`;

					await sendTelegramMessage(message, config.telegramChatId);
				}
			}
		}, 10000); // Check every 10 seconds

		monitoringIntervals.set(walletAddress, interval);

		// Send confirmation message
		const confirmMessage =
			`✅ <b>Wallet Monitoring Started</b>\n\n` +
			`Wallet: ${nickname || walletAddress.slice(0, 8) + "..."}\n` +
			`Address: <code>${walletAddress}</code>`;
		await sendTelegramMessage(confirmMessage, telegramChatId);

		res.json({
			success: true,
			message: "Wallet monitoring started",
			walletAddress,
		});
	} catch (error) {
		console.error("Error starting wallet monitoring:", error);
		res.status(500).json({ error: "Failed to start wallet monitoring" });
	}
});

// Stop monitoring a wallet
app.delete("/api/monitoring/wallets/:address", async (req, res) => {
	try {
		const { address } = req.params;

		const interval = monitoringIntervals.get(address);
		if (interval) {
			clearInterval(interval);
			monitoringIntervals.delete(address);
		}

		const config = monitoredWallets.get(address);
		if (config) {
			monitoredWallets.delete(address);

			// Send confirmation message
			const message =
				`🛑 <b>Wallet Monitoring Stopped</b>\n\n` +
				`Wallet: ${config.nickname || address.slice(0, 8) + "..."}\n` +
				`Address: <code>${address}</code>`;
			await sendTelegramMessage(message, config.telegramChatId);
		}

		res.json({ success: true, message: "Wallet monitoring stopped" });
	} catch (error) {
		console.error("Error stopping wallet monitoring:", error);
		res.status(500).json({ error: "Failed to stop wallet monitoring" });
	}
});

// Get all monitored wallets
app.get("/api/monitoring/wallets", async (req, res) => {
	try {
		const wallets = Array.from(monitoredWallets.values());
		res.json(wallets);
	} catch (error) {
		console.error("Error getting monitored wallets:", error);
		res.status(500).json({ error: "Failed to get monitored wallets" });
	}
});

// Test Telegram connection
app.post("/api/telegram/test", async (req, res) => {
	try {
		const { botToken, chatId } = req.body;

		if (!botToken || !chatId) {
			return res
				.status(400)
				.json({ error: "Bot token and chat ID are required" });
		}

		const response = await axios.get(
			`https://api.telegram.org/bot${botToken}/getMe`
		);

		if (response.data.ok) {
			// Try sending a test message
			const testMessage = "✅ Telegram bot connected successfully!";
			const messageResponse = await axios.post(
				`https://api.telegram.org/bot${botToken}/sendMessage`,
				{
					chat_id: chatId,
					text: testMessage,
				}
			);

			res.json({
				success: true,
				bot: response.data.result,
				messageSent: messageResponse.data.ok,
			});
		} else {
			res.status(400).json({ error: "Invalid bot token" });
		}
	} catch (error) {
		console.error("Telegram test error:", error);
		if (axios.isAxiosError(error)) {
			res.status(error.response?.status || 500).json({
				error: "Telegram connection test failed",
				details: error.response?.data || error.message,
			});
		} else {
			res.status(500).json({ error: "Failed to test Telegram connection" });
		}
	}
});

// Send custom Telegram alert
app.post("/api/telegram/alert", async (req, res) => {
	try {
		const { message, chatId } = req.body;

		if (!message) {
			return res.status(400).json({ error: "Message is required" });
		}

		const sent = await sendTelegramMessage(message, chatId);

		if (sent) {
			res.json({ success: true, message: "Alert sent successfully" });
		} else {
			res.status(500).json({ error: "Failed to send alert" });
		}
	} catch (error) {
		console.error("Error sending Telegram alert:", error);
		res.status(500).json({ error: "Failed to send alert" });
	}
});

// Get wallet stats
app.get("/api/monitoring/wallets/:address/stats", async (req, res) => {
	try {
		const { address } = req.params;

		const pubkey = new PublicKey(address);

		// Get balance
		const balance = (await connection.getBalance(pubkey)) / 1e9;

		// Get recent signatures
		const signatures = await connection.getSignaturesForAddress(pubkey, {
			limit: 100,
		});

		// Get token accounts
		const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
			pubkey,
			{
				programId: new PublicKey(
					"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
				),
			}
		);

		const lastActivity =
			signatures.length > 0 && signatures[0].blockTime
				? new Date(signatures[0].blockTime * 1000).toISOString()
				: null;

		res.json({
			walletAddress: address,
			balance,
			tokenCount: tokenAccounts.value.length,
			recentTransactions: signatures.length,
			lastActivity,
		});
	} catch (error) {
		console.error("Error getting wallet stats:", error);
		res.status(500).json({ error: "Failed to get wallet stats" });
	}
});

app.listen(PORT, () => {
	console.log(`Backend proxy/cache listening on port ${PORT}`);
	console.log(`Telegram bot configured: ${!!TELEGRAM_BOT_TOKEN}`);
	console.log(`Monitoring ready on RPC: ${RPC_ENDPOINT}`);
});
