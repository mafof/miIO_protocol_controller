const miIO = require("./index");

async function main() {
    let miio = new miIO('db71747b18c6eafc5b2ece55713ff4b8', "192.168.1.18");
    await miio.handshake();
    console.log(await miio.sendCommand('get_prop', ["power"]));
}
main();