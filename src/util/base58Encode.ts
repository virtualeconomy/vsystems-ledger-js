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

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export const base58Encode = (buffer: Uint8Array): string => {

    if (!buffer.length) return '';

    const digits = [0];

    for (let i = 0; i < buffer.length; i++) {

        for (let j = 0; j < digits.length; j++) {
            digits[j] <<= 8;
        }

        digits[0] += buffer[i];
        let carry = 0;

        for (let k = 0; k < digits.length; k++) {
            digits[k] += carry;
            carry = (digits[k] / 58) | 0;
            digits[k] %= 58;
        }

        while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
        }

    }

    for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
        digits.push(0);
    }

    return digits.reverse().map(function (digit) {
        return ALPHABET[digit];
    }).join('');

}