import { coday, start } from './scripts.js';
import readline from 'readline/promises';
import fs from 'fs/promises';
import crypto from 'crypto';
import { logger } from './logger.js';
import { banner } from './banner.js';

// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Set default request headers
let headers = {
    'Content-Type': 'application/json',
};

// Registration function
async function register(name, email, password) {
    const payloadReg = {
        full_name: name, // User's full name
        email: email, // User's email
        password: password, // User's password
        referral_code: "LPRV67MRTLO2",
    };
    const response = await coday(
        'https://api.meshchain.ai/meshmain/auth/email-signup', // Registration API endpoint
        'POST', // Using POST method
        headers, // Request headers
        payloadReg // Request payload
    );
    return response.message || "No message returned"; // Return response message
}

// Login function
async function login(email, password) {
    const payloadLogin = {
        email: email, // User's email
        password: password, // User's password
    };
    const response = await coday(
        'https://api.meshchain.ai/meshmain/auth/email-signin', // Login API endpoint
        'POST',
        headers,
        payloadLogin
    );

    if (response.access_token) {
        logger('Login successful!', "success");
        return response;
    }
    logger('Login failed. Please check your credentials.', "error");
    return null;
}

// Email verification function
async function verify(email, otp) {
    const payloadVerify = {
        email: email, // User's email
        code: otp, // OTP code
    };
    const response = await coday(
        'https://api.meshchain.ai/meshmain/auth/verify-email', // Email verification API endpoint
        'POST',
        headers,
        payloadVerify
    );
    return response.message || "Email verification failed";
}

// Reward claiming function
async function claimBnb() {
    const payloadClaim = { mission_id: "ACCOUNT_VERIFICATION" }; // Verification mission ID
    const response = await coday(
        'https://api.meshchain.ai/meshmain/mission/claim', // Reward claiming API endpoint
        'POST',
        headers,
        payloadClaim
    );
    return response.status || "Failed to claim reward";
}

// Generate a 16-byte hexadecimal string
function generateHex() {
    return crypto.randomBytes(16).toString('hex');
}

// Initialize node and save unique ID
async function init(randomHex) {
    const url = "https://api.meshchain.ai/meshmain/nodes/link"; // Node linking API endpoint
    const payload = {
        "unique_id": randomHex, // Unique ID
        "node_type": "browser", // Node type
        "name": "Extension" // Node name
    };

    const response = await coday(url, 'POST', headers, payload);
    if (response.id) {
        try {
            // Append the unique ID to the `unique_id.txt` file
            await fs.appendFile('unique_id.txt', `${response.unique_id}\n`, 'utf-8');
            logger(`Unique ID saved to unique_id.txt: ${response.unique_id}`, "success");
        } catch (err) {
            logger('Failed to save unique ID to file:', "error", err.message);
        }
    }
    return response;
}

// Main function
async function main() {
    try {
        logger(banner, "debug"); // Display banner information

        // Prompt user for input
        const name = await rl.question("Enter your name: ");
        const email = await rl.question("Enter your email: ");
        const password = await rl.question("Enter your password: ");

        // Register account
        const registerMessage = await register(name, email, password);
        logger(`Registration result: ${registerMessage}`);

        // Log in to the account
        const loginData = await login(email, password);
        if (!loginData) return; // Exit if login fails

        // Add access token to headers
        headers = {
            ...headers,
            'Authorization': `Bearer ${loginData.access_token}`, // Add authorization header
        };

        // Verify email
        const otp = await rl.question("Enter the OTP you received in your email: ");
        const verifyMessage = await verify(email, otp);
        logger(`Email verification result: ${verifyMessage}`);

        // Claim rewards
        const claimMessage = await claimBnb();
        logger(`Reward claimed successfully: ${claimMessage}`, "success");

        // Generate and link unique ID
        const randomHex = generateHex();
        const linkResponse = await init(randomHex);

        // Save tokens and unique ID
        try {
            // Append token to the `token.txt` file
            await fs.appendFile(
                'token.txt',
                `${loginData.access_token}|${loginData.refresh_token}\n`,
                'utf-8'
            );
            logger('Tokens saved to token.txt', "success");

            // Start the node
            const starting = await start(linkResponse.unique_id, headers);
            if (starting) {
                logger(`Extension ID: ${linkResponse.unique_id} has been activated`, "success");
            }
        } catch (err) {
            logger('Failed to save data to file:', "error", err.message);
        }
    } catch (error) {
        logger("An error occurred during execution:", "error", error.message);
    } finally {
        rl.close(); // Close readline interface
    }
}

// Run the program
main();
