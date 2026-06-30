require("dotenv").config();
const Scratch = require("scratch-api");
const http = require("http");

// ================= HTTP SERVER (KEEP ALIVE FOR UPTIMEROBOT) =================
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
    encodeMap[chars[i]] = String(i + 10).padStart(2, "0");
}

// ================= ENCODE =================
function encode(text) {
    text = (text || "").toLowerCase();
    let result = "";

    for (const c of text) {
        result += encodeMap[c] ?? encodeMap[" "];
    }

    return result;
}

function encodeComment(user, comment) {
    return encode(user) + "61" + encode(comment);
}

// ================= PACKETS =================
function makePackets(comments) {
    const packets = [];

    for (let i = 0; i < comments.length; i += 10) {
        const group = comments.slice(i, i + 10);

        let packet = String(i / 10 + 1)
            .split("")
            .map(c => encodeMap[c] || "")
            .join("");

        packet += "00";

        for (const c of group) {
            packet += encodeComment(c.author.username, c.content);
            packet += "00";
        }

        packets.push(packet);
    }

    return packets;
}

// ================= SCRATCH SESSION =================
function createSession(username, password) {
    return new Promise((resolve, reject) => {
        Scratch.UserSession.create(username, password, (err, session) => {
            if (err) return reject(err);
            resolve(session);
        });
    });
}

function createCloud(session, projectId) {
    return new Promise((resolve, reject) => {
        session.cloudSession(projectId, (err, cloud) => {
            if (err) return reject(err);
            resolve(cloud);
        });
    });
}

function cloudSet(cloud, name, value) {
    try {
        cloud.set(name, String(value));
    } catch (e) {}
}

// ================= MAIN =================
async function start() {
    console.log("Logging in...");

    const session = await createSession(USERNAME, PASSWORD);
    const cloud = await createCloud(session, PROJECT_ID);

    console.log("☁ Cloud connected");

    let lastCommentId = null;
    let isFast = false;

    async function update() {
        try {

            // ================= STATS =================
            try {
                const statsRes = await fetch(
                    `https://api.scratch.mit.edu/projects/${TARGET_PROJECT}?t=${Date.now()}`
                );

                const data = await statsRes.json();
                const s = data?.stats || {};

                cloudSet(cloud, "☁ view", s.views || 0);
                cloudSet(cloud, "☁ love", s.loves || 0);
                cloudSet(cloud, "☁ favo", s.favorites || 0);
                cloudSet(cloud, "☁ remi", s.remixes || 0);

                console.log("stats OK");
            } catch (e) {
                console.log("Stats error");
            }

            // ================= COMMENTS =================
            const res = await fetch(
                `https://api.scratch.mit.edu/users/${TARGET_USERNAME}/projects/${TARGET_PROJECT}/comments`
            );

            let comments = await res.json();
            if (!Array.isArray(comments)) comments = [];

            if (comments.length === 0) {
                setTimeout(update, 7000);
                return;
            }

            comments.reverse();

            const latest = comments.slice(0, 100);
            const packets = makePackets(latest);

            const currentId = comments[0]?.id;
            const hasNew = currentId && currentId !== lastCommentId;

            lastCommentId = currentId;

            // ================= FAST MODE =================
            if (hasNew && !isFast) {
                console.log("FAST MODE");

                isFast = true;

                for (let i = 0; i < packets.length; i++) {
                    cloudSet(cloud, "☁ comment", packets[i]);
                    await new Promise(r => setTimeout(r, 150)); // chống spam
                }

                isFast = false;
            }

            // ================= NORMAL MODE =================
            else {
                cloudSet(cloud, "☁ comment", packets[0]);
                console.log("NORMAL MODE");
            }

        } catch (err) {
            console.log("Update error:", err.message);
        }

        setTimeout(update, 10000);
    }

    update();
}

start().catch(err => console.error("Fatal:", err));
