const dgram = require('dgram');
const EventEmitter = require('events');


class Network {
    constructor(packet, ip, port = 54321, timeOutMillisecond = 3000) {
        this.packet = packet;
        this.ip = ip;
        this.port = port;
        this.timeOutInterval = timeOutMillisecond;

        this.evHandshake = new EventEmitter();
        this.evMessage   = new EventEmitter();

        this.lastId = Math.floor(Math.random() * (101 - 0)) + 0;

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

        this.socket.on('message', this.messageOn.bind(this));
    }
    
    messageOn(msg, rinfo) {
		let buf = Buffer.from(msg);
        this.packet.packet = buf;
        
        if(this.packet.data) { 
            this.evMessage.emit('message', this.packet.data);
        } else {
            this.evHandshake.emit('handshake');
        }
	}

    updateSocket() {
        if(this.socket == null) return;

        this.socket.close();
        this.createSocket();
    }

    handshake() {
        return new Promise((resolve, reject) => {
            this.packet.clearData();
            const data = this.packet.packet;
            this.socket.send(data, 0, data.length, this.port, this.ip, err => err && reject(err));

            this.evHandshake.addListener('handshake', () => {
                clearTimeout(timer);
                this.evHandshake.removeAllListeners();

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

    call(method, args) {
        if(args === undefined || args === null) args = [];

        const request = {
			method: method,
			params: args
        };
        
        return new Promise((resolve, reject) => {
            if((++this.lastId) <= 10000) {
                request.id = this.lastId;
            } else {
                request.id = this.lastId = 1;
            }

            const json = JSON.stringify(request);
            this.packet.data = Buffer.from(json, 'utf8');
            console.log(json);

            const data = this.packet.packet;
            this.socket.send(data, 0, data.length, this.port, this.ip, err => { if(err) console.log(err); });

            this.evMessage.addListener('message', msg => {
                msg = msg.toString('utf8');
                msg = msg.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
                msg = JSON.parse(msg);

                if(msg.id == this.lastId) {
                    clearTimeout(timer);
                    this.evMessage.removeAllListeners();
                    resolve(msg);
                }
            });

            var timer = setTimeout(() => {
                reject(new Error("device is not response to command"));
            }, this.timeOutInterval);
		});
    }
}

module.exports = Network;