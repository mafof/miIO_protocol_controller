const miIO = require("./index");

async function main() {
    let miio = new miIO("tokenHere", "ipHere");
    await miio.handshake();
    console.log(await miio.sendCommand('get_prop', ["power"]));
}
main();