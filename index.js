require("dotenv").config();

const Scratch = require("scratch-api");
const http = require("http");

// ================= HTTP SERVER =================
http.createServer((req, res) => {
    res.end("alive");
}).listen(process.env.PORT || 3000, () => {
    console.log("HTTP server running");
});

// ================= ENV =================
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const PROJECT_ID = process.env.PROJECT_ID;
const TARGET_USERNAME = process.env.TARGET_USERNAME;
const TARGET_PROJECT = process.env.TARGET_PROJECT;

// ================= CRASH PROTECTION =================
process.on("uncaughtException", (err) => {
    console.log("Crash:", err.message);
});

process.on("unhandledRejection", (err) => {
    console.log("Promise error:", err);
});

// ================= CHAR MAP =================
const chars =
"1234567890qwertyuiopasdfghjklzxcvbnm,.@#₫_&-+()/*\"':;!?=\\][}{%~ ";

const encodeMap = {};

for (let i = 0; i < chars.length; i++) {
    encodeMap[chars[i]] =
        String(i + 10).padStart(2, "0");
}

// ================= ENCODE =================
function encode(text) {

    text = (text || "").toLowerCase();

    let result = "";

    for (const c of text) {

        if (encodeMap[c] !== undefined) {
            result += encodeMap[c];
        } else {
            result += encodeMap[" "];
        }

    }

    return result;

}

function encodeComment(user, comment) {

    return (
        encode(user) +
        "61" +
        encode(comment)
    );

}

// ================= PACKETS =================
function makePackets(comments) {

    const packets = [];

    for (let i = 0; i < comments.length; i += 10) {

        const group =
            comments.slice(i, i + 10);

        // encode batch number
        let packet =
            String(i / 10 + 1)
            .split("")
            .map(c => encodeMap[c] || "")
            .join("");

        packet += "00";

        for (const c of group) {

            packet += encodeComment(
                c.author.username,
                c.content
            );

            packet += "00";

        }

        packets.push(packet);

    }

    return packets;

}

// ================= SAFE FETCH =================
async function safeFetch(url) {

    console.log("FETCH:", url);

    const res = await fetch(url);

    const text = await res.text();

    // debug response
    console.log(text.slice(0, 120));

    // detect html/xml
    if (
        text.startsWith("<") ||
        text.startsWith("<!DOCTYPE") ||
        text.startsWith("<?xml")
    ) {

        console.log("⚠ HTML/XML DETECTED");

        throw new Error("HTML/XML RESPONSE");

    }

    return JSON.parse(text);

}

// ================= SCRATCH SESSION =================
function createSession(username, password) {

    return new Promise((resolve, reject) => {

        Scratch.UserSession.create(
            username,
            password,
            (err, session) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(session);

            }
        );

    });

}

function createCloud(session, projectId) {

    return new Promise((resolve, reject) => {

        session.cloudSession(
            projectId,
            (err, cloud) => {

                if (err) {
                    reject(err);
                    return;
                }

                resolve(cloud);

            }
        );

    });

}

function cloudSet(cloud, name, value) {

    try {

        cloud.set(
            name,
            String(value)
        );

    } catch (e) {

        console.log(
            "Cloud error:",
            e.message
        );

    }

}

// ================= SLEEP =================
function sleep(ms) {

    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });

}

// ================= MAIN =================
async function start() {

    console.log("Logging in...");

    const session =
        await createSession(
            USERNAME,
            PASSWORD
        );

    console.log("Connecting cloud...");

    const cloud =
        await createCloud(
            session,
            PROJECT_ID
        );

    console.log("☁ Cloud connected");

    let lastCommentId = null;
    let isFast = false;
    let normalPacketIndex = 0;

    async function update() {

        try {

            // ================= STATS =================
            try {

                const statsData =
                    await safeFetch(
                        `https://api.scratch.mit.edu/projects/${TARGET_PROJECT}?t=${Date.now()}`
                    );

                const stats =
                    statsData.stats || {};

                cloudSet(
                    cloud,
                    "☁ view",
                    stats.views || 0
                );

                cloudSet(
                    cloud,
                    "☁ love",
                    stats.loves || 0
                );

                cloudSet(
                    cloud,
                    "☁ favo",
                    stats.favorites || 0
                );

                cloudSet(
                    cloud,
                    "☁ remi",
                    stats.remixes || 0
                );

                console.log("Stats updated");

            } catch (e) {

                console.log(
                    "Stats error:",
                    e.message
                );

            }

            // ================= COMMENTS =================
            let comments =
                await safeFetch(
                    `https://api.scratch.mit.edu/users/${TARGET_USERNAME}/projects/${TARGET_PROJECT}/comments?t=${Date.now()}`
                );

            if (!Array.isArray(comments)) {
                comments = [];
            }

            if (comments.length === 0) {

                console.log("No comments");

                setTimeout(update, 15000);

                return;

            }

            // KHÔNG reverse nữa
            // API đã newest first sẵn

            const latest =
                comments.slice(0, 100);

            const packets =
                makePackets(latest);

            // newest comment
            const currentId =
                comments[0]
                ? comments[0].id
                : null;

            console.log(
                "Newest comment:",
                currentId
            );

            const hasNew =
                currentId &&
                currentId !== lastCommentId;

            // lần đầu chạy
            if (lastCommentId === null) {
                lastCommentId = currentId;
            }

            // ================= FAST MODE =================
            if (
                hasNew &&
                !isFast
            ) {

                console.log("FAST MODE");

                isFast = true;

                lastCommentId = currentId;

                for (
                    let i = 0;
                    i < packets.length;
                    i++
                ) {

                    cloudSet(
                        cloud,
                        "☁ comment",
                        packets[i]
                    );

                    console.log(
                        `⚡ Packet ${i + 1}/${packets.length}`
                    );

                    await sleep(6700);

                }

                isFast = false;

                console.log("BACK TO NORMAL");

            }

            // ================= NORMAL MODE =================
            else {

                if (
                    normalPacketIndex >= packets.length
                ) {
                    normalPacketIndex = 0;
                }

                cloudSet(
                    cloud,
                    "☁ comment",
                    packets[normalPacketIndex]
                );

                console.log(
                    `NORMAL PACKET ${normalPacketIndex + 1}/${packets.length}`
                );

                normalPacketIndex++;

            }

        } catch (err) {

            console.log(
                "Update error:",
                err.message
            );

        }

        // update every 15s
        setTimeout(update, 15000);

    }

    update();

}

// ================= AUTO RETRY LOGIN =================
async function boot() {

    while (true) {

        try {

            await start();
            break;

        } catch (err) {

            console.log(
                "Fatal:",
                err.message
            );

            console.log(
                "Retry login in 30s..."
            );

            await sleep(30000);

        }

    }

}

boot();
