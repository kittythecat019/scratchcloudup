```js id="jlwm93"
require("dotenv").config();

const Scratch = require("scratch-api");

const USERNAME =
    process.env.USERNAME;

const PASSWORD =
    process.env.PASSWORD;

const PROJECT_ID =
    process.env.PROJECT_ID;

const TARGET_USERNAME =
    process.env.TARGET_USERNAME;

const TARGET_PROJECT =
    process.env.TARGET_PROJECT;

// bảng ký tự
const chars =
"1234567890qwertyuiopasdfghjklzxcvbnm,.@#₫_&-+()/*\"':;!?=\\][}{%~ ";

// tạo encode map
const encodeMap = {};

for(let i = 0; i < chars.length; i++){

    encodeMap[chars[i]] =
        String(i + 10).padStart(2,"0");

}

// encode text
function encode(text){

    text = text
        .toLowerCase();

    let result = "";

    for(const char of text){

        if(encodeMap[char]){

            result +=
                encodeMap[char];

        }

    }

    return result;

}

// encode comment
function encodeComment(
    username,
    comment
){

    // :
    const colon = "61";

    return (
        encode(username) +
        colon +
        encode(comment)
    );

}

// tạo packet
function makePackets(comments){

    const packets = [];

    for(
        let i = 0;
        i < comments.length;
        i += 10
    ){

        const group =
            comments.slice(i,i+10);

        // batch id
        let packet =
            String((i / 10) + 1)
            .padStart(2,"0");

        for(const c of group){

            packet += "00";

            packet += encodeComment(
                c.author.username,
                c.content
            );

        }

        packets.push(packet);

    }

    return packets;

}

async function start(){

    console.log("Logging in...");

    const session =
        await Scratch.UserSession.create(
            USERNAME,
            PASSWORD
        );

    console.log("Connecting cloud...");

    const cloud =
        await session.cloudSession(
            PROJECT_ID
        );

    console.log("Cloud connected");

    let packetIndex = 0;

    async function update(){

        try{

            // PROJECT STATS
            const statsRes =
                await fetch(
                    `https://api.scratch.mit.edu/projects/${TARGET_PROJECT}`
                );

            const statsData =
                await statsRes.json();

            const views =
                statsData.stats.views || 0;

            const loves =
                statsData.stats.loves || 0;

            const favorites =
                statsData.stats.favorites || 0;

            // COMMENTS
            const commentsRes =
                await fetch(
                    `https://api.scratch.mit.edu/users/${TARGET_USERNAME}/projects/${TARGET_PROJECT}/comments`
                );

            const comments =
                await commentsRes.json();

            // gửi stats
            await cloud.set(
                "☁ view",
                views
            );

            await cloud.set(
                "☁ love",
                loves
            );

            await cloud.set(
                "☁ favo",
                favorites
            );

            await cloud.set(
                "☁ remi",
                comments.length
            );

            console.log(
                "Stats updated"
            );

            // newest first
            comments.reverse();

            // tối đa 100 comments
            const latest =
                comments.slice(0,100);

            // packets
            const packets =
                makePackets(latest);

            if(
                packets.length > 0
            ){

                // loop packet
                if(
                    packetIndex >=
                    packets.length
                ){

                    packetIndex = 0;

                }

                const packet =
                    packets[packetIndex];

                // gửi packet
                await cloud.set(
                    "☁ comment",
                    packet
                );

                console.log(
                    "Packet:",
                    packetIndex + 1
                );

                console.log(packet);

                packetIndex++;

            }

        }catch(err){

            console.log(err);

        }

    }

    update();

    // update mỗi 5 giây
    setInterval(update,5000);

}

start();
```
