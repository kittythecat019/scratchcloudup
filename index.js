require("dotenv").config();

const scratchattach =
require("scratchattach");

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

const encodeMap = {};

for(let i = 0; i < chars.length; i++){

    encodeMap[chars[i]] =
    String(i + 10).padStart(2,"0");

}

function encode(text){

    text =
    text.toLowerCase();

    let result = "";

    for(const char of text){

        if(encodeMap[char]){

            result +=
            encodeMap[char];

        }

    }

    return result;

}

function encodeComment(
    username,
    comment
){

    const colon = "61";

    return (
        encode(username) +
        colon +
        encode(comment)
    );

}

function makePackets(comments){

    const packets = [];

    for(
        let i = 0;
        i < comments.length;
        i += 10
    ){

        const group =
        comments.slice(i,i+10);

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

    console.log("Login...");

    const session =
    await scratchattach.login(
        USERNAME,
        PASSWORD
    );

    console.log("Connected");

    const cloud =
    await session.connect_cloud(
        PROJECT_ID
    );

    console.log("Cloud connected");

    let packetIndex = 0;

    async function update(){

        try{

            // stats
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

            // comments
            const commentsRes =
            await fetch(
            `https://api.scratch.mit.edu/users/${TARGET_USERNAME}/projects/${TARGET_PROJECT}/comments`
            );

            const comments =
            await commentsRes.json();

            // update stats
            await cloud.set_var(
                "view",
                views
            );

            await cloud.set_var(
                "love",
                loves
            );

            await cloud.set_var(
                "favo",
                favorites
            );

            await cloud.set_var(
                "remi",
                comments.length
            );

            // packets
            comments.reverse();

            const latest =
            comments.slice(0,100);

            const packets =
            makePackets(latest);

            if(
                packets.length > 0
            ){

                if(
                    packetIndex >=
                    packets.length
                ){

                    packetIndex = 0;

                }

                await cloud.set_var(
                    "comment",
                    packets[packetIndex]
                );

                console.log(
                    "Packet:",
                    packetIndex + 1
                );

                packetIndex++;

            }

        }catch(err){

            console.log(err);

        }

    }

    update();

    setInterval(update,5000);

}

start();
