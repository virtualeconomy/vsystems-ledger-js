/********************************************************************************
 *   Ledger Node JS API
 *   (c) 2016-2019 Ledger
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 ********************************************************************************/
import { base58Encode } from './util/base58Encode';

declare const Buffer: any;

const VSYS_CONFIG = {
    STATUS: {
        SW_OK: 0x9000,
        SW_USER_CANCELLED: 0x9100,
        SW_CONDITIONS_NOT_SATISFIED: 0x6985,
        SW_BUFFER_OVERFLOW: 0x6990,
        SW_INCORRECT_P1_P2: 0x6A86,
        SW_INS_NOT_SUPPORTED: 0x6D00,
        SW_CLA_NOT_SUPPORTED: 0x6E00,
        SW_SECURITY_STATUS_NOT_SATISFIED: 0x6982
    },
    SECRET: 'VSYS',
    PUBLIC_KEY_LENGTH: 32,
    ADDRESS_LENGTH: 35,
    STATUS_LENGTH: 2,
    SIGNED_CODES: {
        ORDER: 0xFC,
        SOME_DATA: 0xFD,
        REQUEST: 0xFE,
        MESSAGE: 0xFF
    },
    MAX_SIZE: 128,
    VSYS_PRECISION: 8,
    MAIN_NET_CODE: 77
};

export class Vsys {

    protected transport: any;
    protected networkCode: number;
    protected _version: Promise<Array<number>> | null = null;

    constructor(transport: any, networkCode = VSYS_CONFIG.MAIN_NET_CODE) {
        this.transport = transport;
        this.networkCode = networkCode;
        this.decorateClassByTransport();
    }

    decorateClassByTransport() {
        this.transport.decorateAppAPIMethods(
            this,
            [
                'getWalletPublicKey',
                '_signData',
                'getVersion',
            ],
            VSYS_CONFIG.SECRET
        );
    }

    async getWalletPublicKey(path: string, verify = false): Promise<IUserData> {
        const buffer = Vsys.splitPath(path);
        const p1 = verify ? 0x80 : 0x00;
        const response = await this.transport.send(0x80, 0x04, p1, this.networkCode, buffer);
        const publicKey = base58Encode(response.slice(0, VSYS_CONFIG.PUBLIC_KEY_LENGTH));
        const address = response
            .slice(VSYS_CONFIG.PUBLIC_KEY_LENGTH, VSYS_CONFIG.PUBLIC_KEY_LENGTH + VSYS_CONFIG.ADDRESS_LENGTH)
            .toString('ascii');
        const statusCode = response
            .slice(-VSYS_CONFIG.STATUS_LENGTH)
            .toString('hex');
        return { publicKey, address, statusCode };
    }

    async signTransaction(path: string, txData: Uint8Array, version = 1): Promise<string> {

        const transactionType = txData[0];
        const version2 = [transactionType, version];
        const prefixData = Vsys.splitPath(path);

        const dataForSign = await this._fillData(prefixData, txData, version2);
        return await this._signData(dataForSign);
    }

    async getVersion(): Promise<Array<number>> {
        if (!this._version) {
            this._version = this.transport.send(0x80, 0x06, 0, 0);
        }

        try {
            const version: Array<number> = await this._version as Array<number>;
            const isError = Vsys.checkError(version.slice(-2));

            if (isError) {
                throw isError;
            }

            return version.slice(0, -2);
        } catch (e) {
            this._version = null;
            throw e;
        }
    }

    protected async _fillData(prefixBuffer: Uint8Array, dataBuffer: Uint8Array, ver2 = [0, 0]) {
        return Buffer.concat([prefixBuffer, Buffer.from(ver2), dataBuffer]);
    }

    protected async _signData(dataBufferAsync: Uint8Array): Promise<string> {
        const dataBuffer = await dataBufferAsync;
        const maxChunkLength = VSYS_CONFIG.MAX_SIZE - 5;
        const dataLength = dataBuffer.length;
        let sendBytes = 0;
        let result;

        while (dataLength > sendBytes) {
            const chunkLength = Math.min(dataLength - sendBytes, maxChunkLength);
            const isLastByte = (dataLength - sendBytes > maxChunkLength) ? 0x00 : 0x80;
            const chainId = isLastByte ? this.networkCode : 0x00;
            const txChunk = dataBuffer.slice(sendBytes, chunkLength + sendBytes);
            sendBytes += chunkLength;
            result = await this.transport.send(0x80, 0x02, isLastByte, chainId, txChunk);
            const isError = Vsys.checkError(result.slice(-2));
            if (isError) {
                throw isError;
            }
        }

        return base58Encode(result.slice(0, -2));
    }

    static checkError(data: Array<number>): { error: string, status: number } | null {
        const statusCode = data[0] * 256 + data[1];
        if (statusCode === VSYS_CONFIG.STATUS.SW_OK) {
            return null;
        }
        return { error: 'Wrong data', status: statusCode };
    }

    static splitPath(path: string) {
        const result: Array<number> = [];
        path.split('/').forEach(element => {
            let number = parseInt(element, 10);
            if (isNaN(number)) {
                return;
            }
            if (element.length > 1 && element[element.length - 1] === '\'') {
                number += 0x80000000;
            }
            result.push(number);
        });

        const buffer = new Buffer(result.length * 4);

        result.forEach((element, index) => {
            buffer.writeUInt32BE(element, 4 * index);
        });

        return buffer;
    }

}


export interface IUserData {
    publicKey: string;
    address: string;
    statusCode: string;
}