# miIO protocol controller
This is plugin developed by based on plugin [miIO Device Library](https://www.npmjs.com/package/miio)
It's plugin provides simple work above protocol miIO, is provided simple API for send and recieve commands different device's. Have support async methods.

# Usage
 
 ```JavaScript
const miIO = require('miio-controller');
 ```
---
## Example
```JavaScript
let miio = new miIO("tokenHere", "ipHere");
miio.handshake()
    .then(() => {
        miio.sendCommand('get_prop', ["power"])
            .then(res => console.log(res))
            .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
```
## Example with async await
```JavaScript
async function main() {
    let miio = new miIO("tokenHere", "ipHere");
    await miio.handshake();
    console.log(await miio.sendCommand('get_prop', ["power"]));
}
main();
```

## More methods
- sendJson(json) - send custom json string to device.
