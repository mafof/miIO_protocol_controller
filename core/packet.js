const crypto = require('crypto');

class Packet {
    constructor(token = "") {
        this.header = Buffer.alloc(32); // create buffer of size 32
        this._serverStampTime = 0;
        this._serverStamp = 0;
        
        this._token = null;
        this._tokenKey = null;
        this._tokenIV = null;

        this.data = null;

        this.token = Buffer.from(token, 'hex');
        this.formationHelloPackate();
    }

    clearData() {
        this.data = null;
    }

    formationHelloPackate() {
        // Magic value
        this.header[0] = 0x21;
        this.header[1] = 0x31;
        // length
        this.header[2] = 0x00;
        this.header[3] = 0x20;
        // unknow + device type + device id + timeshtamp + checksum
        for(let i=4; i < 32; i++) this.header[i] = 0xff;
        // clear data
        this.clearData();
    }

    set token(t) {
        this._token = Buffer.from(t, 'hex');
        this._tokenKey = crypto.createHash('md5').update(t).digest();
        this._tokenIV  = crypto.createHash('md5').update(this._tokenKey).update(t).digest();
    }

    get token() { return this._token; }

    get stamp() {
        return this.header.readUInt32BE(12);
    }

    get checksum() {
		return this.header.slice(16);
	}

    set packet(msg) {
        msg.copy(this.header, 0, 0, 32);

        const stamp = this.stamp;
        if(stamp > 0) {
            this._serverStamp = stamp;
            this._serverStampTime = Date.now();
        }

        const encryptedData = msg.slice(32);

        if(encryptedData.length > 0) {
            if(!this.token) return this.clearData();

            const digest = crypto.createHash('md5')
            .update(this.header.slice(0, 16))
            .update(this.token)
            .update(encryptedData)
            .digest();

            const checksum = this.checksum;
            if(checksum.equals(digest)) {
                let decipher = crypto.createDecipheriv('aes-128-cbc', this._tokenKey, this._tokenIV);
                this.data = Buffer.concat([
                    decipher.update(encryptedData),
                    decipher.final()
                ]);

            } else { this.clearData(); }
        
        } else {
            this.clearData();
        }
    }

    get packet() {
        if(this.data) {
            if(!this.token) throw new Error("Token is not found");

            for(let i=4; i<8; i++) this.header[i] = 0x00;

            if(this._serverStampTime) {
				const secondsPassed = Math.floor(Date.now() - this._serverStampTime) / 1000;
				this.header.writeUInt32BE(this._serverStamp + secondsPassed, 12);
            }
            
            // encrypt data
            let cipher = crypto.createCipheriv('aes-128-cbc', this._tokenKey, this._tokenIV);
			let encrypted = Buffer.concat([
				cipher.update(this.data),
				cipher.final()
            ]);
            
            // set length
            this.header.writeUInt16BE(32 + encrypted.length, 2);


            // calculate checksum
            let digest = crypto.createHash('md5')
                .update(this.header.slice(0, 16))
                .update(this.token)
                .update(encrypted)
                .digest();
            digest.copy(this.header, 16);


            return Buffer.concat([ this.header, encrypted ]);
        } else {
            this.formationHelloPackate();
            return this.header;
        }
    }
}

module.exports = Packet;