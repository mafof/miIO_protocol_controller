const dgram = require('dgram');
const EventEmitter = require('events');
const Packet = require("./packet");


class Network extends EventEmitter {
    constructor(packetOrToken, ip, timeOutMillisecond = 3000, port = 54321) {
        super();
        this.packet = (typeof packetOrToken == "string") ? new Packet(packetOrToken) : packetOrToken;
        this.ip = ip;
        this.port = port;
        this.timeOutInterval = timeOutMillisecond;

        this._lastId = Math.floor(Math.random() * (101 - 0)) + 0;

        this.createSocket();
    }

    createSocket() {
        this.socket = dgram.createSocket('udp4');

        this.socket.bind();

        this.socket.on('listening', () => {
            this.socket.setBroadcast(true);

            const address = this.socket.address();
			console.log('Network bound to port', address.port);
        });

        this.socket.on('message', this.onMessage.bind(this));
    }
    
    onMessage(msg, rinfo) {
		let buf = Buffer.from(msg);
        this.packet.packet = buf;
        
        if(this.packet.data) this.emit('message', this.packet.data);
        else this.emit('handshakeRes');
	}

    updateSocket() {
        if(this.socket == null) return;

        this.socket.close();
        this.createSocket();
    }

    transformToValidJsonResponseData(data) {
        try {
            data = data.toString('utf8');
            data = data.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
            data = JSON.parse(data);

            return data;
        } catch (err) {
            console.log(Error("JSON is invalid"));
            return null;
        }
    }

    get lastId() {
        if((++this._lastId) <= 10000) return this._lastId;
        else return this._lastId = 1;
    }

    handshake() {
        return new Promise((resolve, reject) => {
            this.packet.clearData();
            const data = this.packet.packet;
            this.socket.send(data, 0, data.length, this.port, this.ip, err => err && reject(err));

            this.once('handshakeRes', () => {
                clearTimeout(timer);

                if(this.packet.checksum.toString('hex') != "00000000000000000000000000000000" 
                && this.packet.checksum.toString('hex') != "ffffffffffffffffffffffffffffffff") {
                    this.packet.token = Buffer.from(this.packet.checksum, 'hex');
                }
                resolve(this.packet.checksum);
            })
        
            var timer = setTimeout(() => {
                reject(new Error("device is not response to handshake"));
            }, this.timeOutInterval);
        });
    }

    sendCommand(method, args) {
        if(args === undefined || args === null) args = [];

        const request = {
			method: method,
			params: args
        };
        
        return new Promise((resolve, reject) => {
            request.id = this.lastId;

            const json = JSON.stringify(request);
            this.packet.data = Buffer.from(json, 'utf8');

            const data = this.packet.packet;
            this.socket.send(data, 0, data.length, this.port, this.ip, err => { if(err) console.log(err); });

            this.once('message', msg => {
                if((msg = this.transformToValidJsonResponseData(msg)) == null) return;

                if(msg.id == this._lastId) {
                    clearTimeout(timer);
                    resolve(msg);
                }
            });

            var timer = setTimeout(() => {
                reject(new Error("device is not response to command"));
            }, this.timeOutInterval);
		});
    }

    sendJson(cmd) {
        return new Promise((resolve, reject) => {
            try {
                if(typeof cmd == "string") cmd = JSON.parse(cmd);
                cmd.id = this.lastId;

                const json = JSON.stringify(cmd);
                this.packet.data = Buffer.from(json, 'utf8');

                const data = this.packet.packet;
                this.socket.send(data, 0, data.length, this.port, this.ip, err => { if(err) console.log(err); });

                this.once('message', msg => {
                    if((msg = this.transformToValidJsonResponseData(msg)) == null) return;
    
                    if(msg.id == this._lastId) {
                        clearTimeout(timer);
                        resolve(msg);
                    }
                });
    
                var timer = setTimeout(() => {
                    reject(new Error("device is not response to command"));
                }, this.timeOutInterval);

            } catch (err) {
                throw new Error("input data is has invalid json");
            }
        });
    }
}

module.exports = Network;