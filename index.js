```js id="jlwm55"
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

// encode map
const encodeMap = {};

for(let i = 0; i < chars.length; i++){

    encodeMap[chars[i]] =
        String(i + 10).padStart(2,"0");

}

// encode text
function encode(text){

    text = text.toLowerCase();

    let result = "";

    for(const char of text){

        if(encodeMap[char]){

            result += encodeMap[char];

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

// packet
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

    console.log("Login...");

    const session =
        await Scratch.UserSession.create(
            USERNAME,
            PASSWORD
        );

    const cloud =
        await session.cloudSession(
            PROJECT_ID
        );

    console.log("Cloud connected");

    let packetIndex = 0;

    async function update(){

        try{

            // comments api
            const res =
                await fetch(
                    `https://api.scratch.mit.edu/users/${TARGET_USERNAME}/projects/${TARGET_PROJECT}/comments`
                );

            const comments =
                await res.json();

            // mới nhất trước
            comments.reverse();

            // lấy tối đa 100 comments
            const latest =
                comments.slice(0,100);

            // packets
            const packets =
                makePackets(latest);

            if(
                packets.length === 0
            ) return;

            // loop packet
            if(
                packetIndex >=
                packets.length
            ){

                packetIndex = 0;

            }

            const packet =
                packets[packetIndex];

            // gửi cloud
            await cloud.set(
                "☁ comment",
                packet
            );

            console.log(
                "Sent packet:",
                packetIndex + 1
            );

            packetIndex++;

        }catch(err){

            console.log(err);

        }

    }

    update();

    // mỗi 5 giây gửi batch tiếp theo
    setInterval(update,5000);

}

start();
```
