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

    console.log(
        "Crash:",
        err.message
    );

});

process.on("unhandledRejection", (err) => {

    console.log(
        "Promise error:",
        err
    );

});

// ================= CHAR MAP =================
const chars =
"1234567890qwertyuiopasdfghjklzxcvbnm,.@#₫_&-+()/*\"':;!?=\\][}{%~ ";

const encodeMap = {};

for (let i = 0; i < chars.length; i++) {

    encodeMap[chars[i]] =
        String(i + 10).padStart(2, "0");

}

// ================= HTML ENTITY DECODE =================
function decodeHtmlEntities(text) {

    return String(text)

        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")

        // vietnamese
        
    .replace(/&agrave;/g, "à")
    .replace(/&aacute;/g, "á")
    .replace(/&acirc;/g, "â")
    .replace(/&atilde;/g, "ã")
    .replace(/&egrave;/g, "è")
    .replace(/&eacute;/g, "é")
    .replace(/&ecirc;/g, "ê")
    .replace(/&igrave;/g, "ì")
    .replace(/&iacute;/g, "í")
    .replace(/&ograve;/g, "ò")
    .replace(/&oacute;/g, "ó")
    .replace(/&ocirc;/g, "ô")
    .replace(/&otilde;/g, "õ")
    .replace(/&ugrave;/g, "ù")
    .replace(/&uacute;/g, "ú")
    .replace(/&yacute;/g, "ý")
    .replace(/&dstrok;/g, "đ")
    .replace(/&Agrave;/g, "À")
    .replace(/&Aacute;/g, "Á")
    .replace(/&Acirc;/g, "Â")
    .replace(/&Atilde;/g, "Ã")
    .replace(/&Egrave;/g, "È")
    .replace(/&Eacute;/g, "É")
    .replace(/&Ecirc;/g, "Ê")
    .replace(/&Igrave;/g, "Ì")
    .replace(/&Iacute;/g, "Í")
    .replace(/&Ograve;/g, "Ò")
    .replace(/&Oacute;/g, "Ó")
    .replace(/&Ocirc;/g, "Ô")
    .replace(/&Otilde;/g, "Õ")
    .replace(/&Ugrave;/g, "Ù")
    .replace(/&Uacute;/g, "Ú")
    .replace(/&Yacute;/g, "Ý")
    .replace(/&Dstrok;/g, "Đ")

    .replace(/&#7841;/g, "ạ").replace(/&#7843;/g, "ả").replace(/&#7845;/g, "ấ").replace(/&#7847;/g, "ầ")
    .replace(/&#7849;/g, "ẩ").replace(/&#7851;/g, "ẫ").replace(/&#7853;/g, "ậ").replace(/&#259;/g, "ă")
    .replace(/&#7855;/g, "ắ").replace(/&#7857;/g, "ằ").replace(/&#7859;/g, "ẳ").replace(/&#7861;/g, "ẵ")
    .replace(/&#7863;/g, "ặ").replace(/&#7865;/g, "ẹ").replace(/&#7867;/g, "ẻ").replace(/&#7869;/g, "ẽ")
    .replace(/&#7871;/g, "ế").replace(/&#7873;/g, "ề").replace(/&#7875;/g, "ể").replace(/&#7877;/g, "ễ")
    .replace(/&#7879;/g, "ệ").replace(/&#7881;/g, "ỉ").replace(/&#297;/g, "ĩ").replace(/&#7883;/g, "ị")
    .replace(/&#7885;/g, "ọ").replace(/&#7887;/g, "ỏ").replace(/&#7889;/g, "ố").replace(/&#7891;/g, "ồ")
    .replace(/&#7893;/g, "ổ").replace(/&#7895;/g, "ỗ").replace(/&#7897;/g, "ộ").replace(/&#417;/g, "ơ")
    .replace(/&#7899;/g, "ớ").replace(/&#7901;/g, "ờ").replace(/&#7903;/g, "ở").replace(/&#7905;/g, "ỡ")
    .replace(/&#7907;/g, "ợ").replace(/&#7911;/g, "ủ").replace(/&#369;/g, "ũ").replace(/&#7913;/g, "ụ")
    .replace(/&#432;/g, "ư").replace(/&#7915;/g, "ứ").replace(/&#7917;/g, "ừ").replace(/&#7919;/g, "ử")
    .replace(/&#7921;/g, "ữ").replace(/&#7923;/g, "ự").replace(/&#7923;/g, "ỳ").replace(/&#7927;/g, "ỷ")
    .replace(/&#7929;/g, "ỹ").replace(/&#7925;/g, "ỵ").replace(/&#273;/g, "đ")

    .replace(/&#7840;/g, "Ạ").replace(/&#7842;/g, "Ả").replace(/&#7844;/g, "Ấ").replace(/&#7846;/g, "Ầ")
    .replace(/&#7848;/g, "Ẩ").replace(/&#7850;/g, "Ẫ").replace(/&#7852;/g, "Ậ").replace(/&#258;/g, "Ă")
    .replace(/&#7854;/g, "Ắ").replace(/&#7856;/g, "Ằ").replace(/&#7858;/g, "Ẳ").replace(/&#7860;/g, "Ẵ")
    .replace(/&#7862;/g, "Ặ").replace(/&#7864;/g, "Ẹ").replace(/&#7866;/g, "Ẻ").replace(/&#7868;/g, "Ẽ")
    .replace(/&#7870;/g, "Ế").replace(/&#7872;/g, "Ề").replace(/&#7874;/g, "Ể").replace(/&#7876;/g, "Ễ")
    .replace(/&#7878;/g, "Ệ").replace(/&#7880;/g, "Ỉ").replace(/&#296;/g, "Ĩ").replace(/&#7882;/g, "Ị")
    .replace(/&#7884;/g, "Ọ").replace(/&#7886;/g, "Ỏ").replace(/&#7888;/g, "Ố").replace(/&#7890;/g, "Ồ")
    .replace(/&#7892;/g, "Ổ").replace(/&#7894;/g, "Ỗ").replace(/&#7896;/g, "Ộ").replace(/&#416;/g, "Ơ")
    .replace(/&#7898;/g, "Ớ").replace(/&#7900;/g, "Ờ").replace(/&#7902;/g, "Ở").replace(/&#7904;/g, "Ỡ")
    .replace(/&#7906;/g, "Ợ").replace(/&#7910;/g, "Ủ").replace(/&#368;/g, "Ũ").replace(/&#7912;/g, "Ụ")
    .replace(/&#431;/g, "Ư").replace(/&#7914;/g, "Ứ").replace(/&#7916;/g, "Ừ").replace(/&#7918;/g, "Ử")
    .replace(/&#7920;/g, "Ữ").replace(/&#7922;/g, "Ự").replace(/&#7922;/g, "Ỳ").replace(/&#7926;/g, "Ỷ")
    .replace(/&#7928;/g, "Ỹ").replace(/&#7924;/g, "Ỵ").replace(/&#272;/g, "Đ");

}

// ================= NORMALIZE VIETNAMESE =================
function normalizeVietnamese(text) {

    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d");

}

// ================= ENCODE =================
function encode(text) {

    text = normalizeVietnamese(
        (text || "").toLowerCase()
    );

    let result = "";

    for (const c of text) {

        result +=
            encodeMap[c]
            ?? encodeMap[" "];

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
// 5 comments per packet
function makePackets(comments) {

    const packets = [];

    for (
        let i = 0;
        i < comments.length;
        i += 5
    ) {

        const group =
            comments.slice(i, i + 5);

        // batch number
        const batch =
            Math.floor(i / 5) + 1;

        let packet =
            encode(String(batch));

        packet += "00";

        for (const c of group) {

            packet += encodeComment(
                c.author.username,
                decodeHtmlEntities(
                    c.content
                )
            );

            packet += "00";

        }

        packets.push(packet);

    }

    return packets;

}

// ================= SAFE FETCH =================
async function safeFetch(url) {

    const res = await fetch(url);

    const buffer =
        await res.arrayBuffer();

    const text =
        new TextDecoder("utf-8")
        .decode(buffer);

    // detect html/xml
    if (
        text.startsWith("<") ||
        text.startsWith("<!DOCTYPE") ||
        text.startsWith("<?xml")
    ) {

        console.log(
            "HTML/XML DETECTED"
        );

        console.log(
            text.slice(0, 200)
        );

        throw new Error(
            "HTML/XML RESPONSE"
        );

    }

    return JSON.parse(text);

}

// ================= SLEEP =================
function sleep(ms) {

    return new Promise((resolve) => {

        setTimeout(resolve, ms);

    });

}

// ================= SCRATCH LOGIN =================
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

// ================= CLOUD SET =================
async function cloudSet(cloud, name, value) {

    try {

        value = String(value);

        console.log(
            `SET ${name} (${value.length})`
        );

        cloud.set(
            name,
            value
        );

        // anti spam
        await sleep(1000);

    } catch (e) {

        console.log(
            "Cloud error:",
            e.message
        );

    }

}

// ================= MAIN =================
async function start() {

    console.log("Logging in...");

    const session =
        await createSession(
            USERNAME,
            PASSWORD
        );

    console.log(
        "Connecting cloud..."
    );

    const cloud =
        await createCloud(
            session,
            PROJECT_ID
        );

    console.log(
        "Cloud connected"
    );

    let packetIndex = 0;

    // 0 = stats
    // 1 = comments
    let updateMode = 0;

    async function update() {

        try {

            // ================= STATS MODE =================
            if (updateMode === 0) {

                try {

                    const statsData =
                        await safeFetch(
                            `https://api.scratch.mit.edu/projects/${TARGET_PROJECT}?t=${Date.now()}`
                        );

                    const s =
                        statsData.stats || {};

                    await cloudSet(
                        cloud,
                        "☁ view",
                        s.views || 0
                    );

                    await cloudSet(
                        cloud,
                        "☁ love",
                        s.loves || 0
                    );

                    await cloudSet(
                        cloud,
                        "☁ favo",
                        s.favorites || 0
                    );

                    await cloudSet(
                        cloud,
                        "☁ remi",
                        s.remixes || 0
                    );

                    console.log(
                        "Stats updated"
                    );

                } catch (e) {

                    console.log(
                        "Stats error:",
                        e.message
                    );

                }

                // next update = comments
                updateMode = 1;

            }

            // ================= COMMENTS MODE =================
            else {

                let comments =
                    await safeFetch(
                        `https://api.scratch.mit.edu/users/${TARGET_USERNAME}/projects/${TARGET_PROJECT}/comments?t=${Date.now()}`
                    );

                if (!Array.isArray(comments)) {

                    comments = [];

                }

                if (comments.length === 0) {

                    console.log(
                        "No comments"
                    );

                    setTimeout(
                        update,
                        10000
                    );

                    return;

                }

                // newest first
                const latest =
                    comments.slice(0, 100);

                const packets =
                    makePackets(latest);

                // reset packet index
                if (
                    packetIndex >= packets.length
                ) {

                    packetIndex = 0;

                }

                console.log(
                    `PACKET ${packetIndex + 1}/${packets.length}`
                );

                // send ONE packet only
                await cloudSet(
                    cloud,
                    "☁ comment",
                    packets[packetIndex]
                );

                // next packet
                packetIndex++;

                // next update = stats
                updateMode = 0;

            }

        } catch (err) {

            console.log(
                "Update error:",
                err.message
            );

        }

        // scratch cloud slow
        setTimeout(
            update,
            10000
        );

    }

    update();

}

// ================= AUTO RETRY =================
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
                "Retry in 30s..."
            );

            await sleep(30000);

        }

    }

}

boot();
