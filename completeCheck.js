import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 STARTING FULL SYSTEM AUDIT (V2) 🚀");
console.log("===============================================");

// --- STAGE 1: PATH & IMPORT AUDIT ---
console.log("\n📁 [1/4] Scanning Imports & File Structure...");
const scanDirs = ['src/controllers', 'src/routes', 'middlewares'];
let brokenCount = 0;

scanDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) return;
    fs.readdirSync(fullPath).forEach(file => {
        const filePath = path.join(fullPath, file);
        if (fs.lstatSync(filePath).isDirectory()) return;
        const content = fs.readFileSync(filePath, 'utf-8');
        const importRegex = /from\s+["'](.+?)["']/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const absPath = path.resolve(fullPath, match[1]);
            if (match[1].startsWith('.') && !fs.existsSync(absPath)) {
                console.error(`❌ BROKEN: ${path.relative(__dirname, filePath)} -> "${match[1]}"`);
                brokenCount++;
            }
        }
    });
});
if (brokenCount === 0) console.log("✅ All Internal Path Handshakes: OK");

// --- STAGE 2: MONGODB CONNECTION CHECK ---
console.log("\n🍃 [2/4] Testing MongoDB Connection...");
const testMongo = async () => {
    try {
        if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing in .env");
        await mongoose.connect(`${process.env.MONGODB_URI}/preflight-test`);
        console.log("✅ MongoDB Connection: SUCCESSFUL");
        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ MongoDB Connection: FAILED");
        console.error(`   Reason: ${error.message}`);
    }
};

// --- STAGE 3: CLOUDINARY CREDENTIAL CHECK ---
console.log("\n☁️ [3/4] Testing Cloudinary Configuration...");
const testCloudinary = async () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        const result = await cloudinary.api.ping();
        if (result.status === 'ok') {
            console.log("✅ Cloudinary Configuration: SUCCESSFUL");
        }
    } catch (error) {
        console.error("❌ Cloudinary Configuration: FAILED");
        console.error(`   Reason: ${error.message}`);
    }
};

// --- STAGE 4: ENV VARIABLE CHECK ---
console.log("\n🔑 [4/4] Checking Environment Variables...");
const requiredEnv = [
    'PORT', 'MONGODB_URI', 'CORS_ORIGIN', 
    'ACCESS_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET',
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'
];
requiredEnv.forEach(key => {
    if (process.env[key]) console.log(`✅ ${key.padEnd(25)}: SET`);
    else console.error(`❌ ${key.padEnd(25)}: MISSING`);
});

// Run Async Tests
await testMongo();
await testCloudinary();

console.log("\n===============================================");
console.log("🏁 AUDIT COMPLETE.");
process.exit();