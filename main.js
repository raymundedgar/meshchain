import { coday, estimate, claim, start, info } from './scripts.js';
import { logger } from './logger.js';
import fs from 'fs/promises';
import { banner } from './banner.js';

let headers = {
    'Content-Type': 'application/json',
};

// Function to read tokens and unique IDs from files
async function readTokensAndIds() {
    try {
        const tokenData = await fs.readFile('token.txt', 'utf-8');
        const tokens = tokenData.split('\n').filter(line => line.trim());

        const idsData = await fs.readFile('unique_id.txt', 'utf-8');
        const uniqueIds = idsData.split('\n').filter(line => line.trim());

        if (tokens.length !== uniqueIds.length) {
            logger("The number of tokens does not match the number of unique IDs.", "error");
            return [];
        }

        const accounts = tokens.map((line, index) => {
            const [access_token, refresh_token] = line.split('|').map(token => token.trim());
            return { access_token, refresh_token, unique_id: uniqueIds[index].trim() };
        });

        return accounts;
    } catch (err) {
        logger("Failed to read the token or unique ID file:", "error", err.message);
        return [];
    }
}

// Function to refresh tokens
async function refreshToken(refresh_token, accountIndex) {
    logger(`Refreshing access token for account ${accountIndex + 1}...`, "info");
    const payloadData = { refresh_token };
    const response = await coday("https://api.meshchain.ai/meshmain/auth/refresh-token", 'POST', headers, payloadData);

    if (response && response.access_token) {
        // Update the current account's tokens
        const tokenLines = (await fs.readFile('token.txt', 'utf-8')).split('\n');
        tokenLines[accountIndex] = `${response.access_token}|${response.refresh_token}`;
        await fs.writeFile('token.txt', tokenLines.join('\n'), 'utf-8');
        logger(`Tokens for account ${accountIndex + 1} refreshed successfully.`, "success");
        return response.access_token;
    }
    logger(`Failed to refresh tokens for account ${accountIndex + 1}.`, "error");
    return null;
}

// Main logic for handling a single account
async function processAccount({ access_token, refresh_token, unique_id }, accountIndex) {
    headers = {
        ...headers,
        Authorization: `Bearer ${access_token}`,
    };

    const profile = await info(unique_id, headers);

    if (profile.error) {
        logger(`Account ${accountIndex + 1} | ${unique_id}: Failed to retrieve account info, attempting to refresh token...`, "error");
        const newAccessToken = await refreshToken(refresh_token, accountIndex);
        if (!newAccessToken) return;
        headers.Authorization = `Bearer ${newAccessToken}`;
    } else {
        const { name, total_reward } = profile;
        logger(`Account ${accountIndex + 1} | ${unique_id}: ${name} | Balance: ${total_reward}`, "success");
    }

    const filled = await estimate(unique_id, headers);
    if (!filled) {
        logger(`Account ${accountIndex + 1} | ${unique_id}: Failed to retrieve estimate value.`, "error");
        return;
    }

    if (filled.value > 1) {
        logger(`Account ${accountIndex + 1} | ${unique_id}: Attempting to claim rewards...`);
        const reward = await claim(unique_id, headers);
        if (reward) {
            logger(`Account ${accountIndex + 1} | ${unique_id}: Rewards claimed successfully! New balance: ${reward}`, "success");
            await start(unique_id, headers);
            logger(`Account ${accountIndex + 1} | ${unique_id}: Mining restarted.`, "info");
        } else {
            logger(`Account ${accountIndex + 1} | ${unique_id}: Failed to claim rewards.`, "error");
        }
    } else {
        logger(`Account ${accountIndex + 1} | ${unique_id}: Mining already active. Current mining value: ${filled.value}`, "info");
    }
}

// Main function to process all accounts
async function main() {
    logger(banner, "debug");

    while (true) {
        const accounts = await readTokensAndIds();

        if (accounts.length === 0) {
            logger("No accounts to process.", "error");
            return;
        }
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            logger(`Processing account ${i + 1}...`, "info");
            await processAccount(account, i);
        }
        await new Promise(resolve => setTimeout(resolve, 60000)); // Run every 60 seconds
    }
}

// Start the main function
main();
