const Packet = require("./core/packet");
const Network = require("./core/network");


async function main() {
    let packet = new Packet('db71747b18c6eafc5b2ece55713ff4b8');
    let network = new Network(packet, "192.168.1.18", 54321);
    console.log(await network.handshake());
    //console.log(await network.call('set_led_b', ["1"]));
    //console.log(await network.call('get_prop', ["power", "mode", "buzzer", "led", "led_b"]));
    await network.call('set_led_b', ["1"]);
    //console.log(await network.call('get_prop', ["led", "led_b"]));

    // console.log(await network.call('set_power', ["on"]));
    
    // let packet = new Packet('7877564b42466533755468366c7a3965');
    // let network = new Network(packet, "192.168.1.8", 54321);
    // await network.handshake();
    //console.log(await network.call('app_rc_start', []));

    // let packet = new Packet();
    // let network = new Network(packet, "192.168.1.56", 54321);
    // await network.handshake();
    // console.log(await network.call('get_prop', ["power"]));
    // for(let i=10000000; i <= 99999999; i++) {
    //     await network.call('set_rgb', [i]);
    //     console.log(i);
    // }
}
main();