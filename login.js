import { coday } from './scripts.js';
import fs from 'fs/promises';
import readline from 'readline/promises';
import crypto from 'crypto';
import { logger } from './logger.js';

function generateUniqueId() {
    return crypto.randomBytes(16).toString('hex');
}

async function saveUniqueIdToFile(unique_id) {
    await fs.appendFile('unique_id.txt', `${unique_id}\n`, 'utf-8');
    logger("Unique ID successfully saved to unique_id.txt file!", "success");
}

async function linkNode(unique_id) {
    const url = "https://api.meshchain.ai/meshmain/nodes/link";
    const payload = {
        unique_id,
        node_type: "browser",
        name: "Extension"
    };

    const response = await coday(url, 'POST', {
        'Content-Type': 'application/json'
    }, payload);

    if (response && response.id) {
        logger(`Node successfully linked! ID: ${unique_id}`, "success");
        return response;
    } else {
        logger("Failed to link node. Please check your network or account information.", "error");
    }
}

async function login(email, password) {
    const payloadLogin = {
        email: email,
        password: password
    };

    const response = await coday(
        'https://api.meshchain.ai/meshmain/auth/email-signin',
        'POST',
        {
            'Content-Type': 'application/json'
        },
        payloadLogin
    );

    if (response.access_token) {
        logger("Login successful!", "success");
        logger(`Access Token: ${response.access_token}`);
        logger(`Refresh Token: ${response.refresh_token}`);
        return response;
    } else {
        logger("Login failed. Please check your email and password.", "error");
        return null;
    }
}

async function saveTokenToFile(access_token, refresh_token) {
    const tokenLine = `${access_token}|${refresh_token}\n`;
    await fs.appendFile('token.txt', tokenLine, 'utf-8');
    logger("Token successfully saved to token.txt file!", "success");
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const email = await rl.question("Please enter your email: ");
        const password = await rl.question("Please enter your password: ", { hideEchoBack: true });

        const tokens = await login(email, password);

        if (tokens) {
            await saveTokenToFile(tokens.access_token, tokens.refresh_token);

            const unique_id = generateUniqueId();
            await saveUniqueIdToFile(unique_id);

            await linkNode(unique_id);
        }
    } catch (error) {
        logger(`An error occurred: ${error.message}`, "error");
    } finally {
        rl.close();
    }
}

main();
