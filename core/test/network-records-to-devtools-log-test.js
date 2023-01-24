/**
 * @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {NetworkRecorder} from '../../core/lib/network-recorder.js';
import {networkRecordsToDevtoolsLog} from './network-records-to-devtools-log.js';
import {readJson} from './test-utils.js';

const lcpDevtoolsLog = readJson('./fixtures/traces/lcp-m78.devtools.log.json', import.meta);

describe('networkRecordsToDevtoolsLog', () => {
  it('should generate the four messages per request', () => {
    const records = [{url: 'http://example.com'}];
    const log = networkRecordsToDevtoolsLog(records);
    expect(log).toMatchObject([
      {method: 'Network.requestWillBeSent', params: {request: {url: 'http://example.com'}}},
      {method: 'Network.responseReceived', params: {response: {url: 'http://example.com'}}},
      {method: 'Network.dataReceived'},
      {method: 'Network.loadingFinished'},
    ]);
  });

  it('should set resource and transfer sizes', () => {
    const records = [{url: 'http://example.com', resourceSize: 1024, transferSize: 2048}];
    const log = networkRecordsToDevtoolsLog(records);
    expect(log).toMatchObject([
      {method: 'Network.requestWillBeSent', params: {request: {url: 'http://example.com'}}},
      {method: 'Network.responseReceived', params: {response: {url: 'http://example.com'}}},
      {method: 'Network.dataReceived', params: {dataLength: 1024, encodedDataLength: 2048}},
      {method: 'Network.loadingFinished', params: {encodedDataLength: 2048}},
    ]);
  });

  it('should handle redirects', () => {
    const records = [
      {requestId: '0', url: 'http://example.com/'},
      {requestId: '0:redirect', url: 'http://www.example.com/'},
    ];

    const log = networkRecordsToDevtoolsLog(records);
    expect(log).toMatchObject([
      {method: 'Network.requestWillBeSent', params: {request: {url: 'http://example.com/'}}},
      {method: 'Network.requestWillBeSent', params: {request: {url: 'http://www.example.com/'}}},
      {method: 'Network.responseReceived', params: {response: {url: 'http://www.example.com/'}}},
      {method: 'Network.dataReceived'},
      {method: 'Network.loadingFinished'},
    ]);
  });

  it('should roundtrip a real devtools log properly', () => {
    const records = NetworkRecorder.recordsFromLogs(lcpDevtoolsLog);

    // Skip verification in the method because we have circular references.
    // We'll do our own stricter verification.
    const roundTripLogs = networkRecordsToDevtoolsLog(records, {skipVerification: true});
    const roundTripRecords = NetworkRecorder.recordsFromLogs(roundTripLogs);

    expect(roundTripRecords).toEqual(records);
  });

  it('should roundtrip fake network records multiple times', () => {
    const records = [
      {requestId: '0', url: 'http://example.com/'},
      {requestId: '0:redirect', url: 'https://www.example.com/'},
      {url: 'https://example.com/img.png', rendererStartTime: 14, startTime: 15, endTime: 15.5},
      {url: 'https://example.com/style.css', timing: {receiveHeadersEnd: 400, sendEnd: 200}},
      {url: 'https://example.com/0.js', rendererStartTime: 10000},
      {url: 'https://example.com/1.js', startTime: 2000, responseReceivedTime: 3250},
      {url: 'https://example.com/2.js', timing: {requestTime: 5}},
      {url: 'https://example.com/3.js', endTime: -1},
      {url: 'https://example.com/4.js', timing: {sendEnd: 1200}},
      {},
    ];

    const devtoolsLog = networkRecordsToDevtoolsLog(records);
    const roundTripRecords = NetworkRecorder.recordsFromLogs(devtoolsLog);

    const devtoolsLog2 = networkRecordsToDevtoolsLog(roundTripRecords);
    const roundTripRecords2 = NetworkRecorder.recordsFromLogs(devtoolsLog2);
    expect(roundTripRecords2).toMatchObject(roundTripRecords);

    const devtoolsLog3 = networkRecordsToDevtoolsLog(roundTripRecords2);
    const roundTripRecords3 = NetworkRecorder.recordsFromLogs(devtoolsLog3);
    expect(roundTripRecords3).toMatchObject(roundTripRecords2);
    expect(roundTripRecords3).toMatchObject(roundTripRecords);
    expect(roundTripRecords3).toMatchObject(records);
  });

  it('should throw on impossible network requests', () => {
    expect(() => networkRecordsToDevtoolsLog([{rendererStartTime: 5, startTime: 1}]))
      .toThrow(`'rendererStartTime' (5) exceeds 'startTime' (1)`);
    expect(() => networkRecordsToDevtoolsLog([{rendererStartTime: 5, endTime: 1}]))
      .toThrow(`'rendererStartTime' (5) exceeds 'endTime' (1)`);

    expect(() => networkRecordsToDevtoolsLog([{startTime: 1000, timing: {requestTime: 2}}]))
      .toThrow(`'startTime' (1000) is not equal to 'timing.requestTime' (2 seconds)`);

    /* eslint-disable max-len */
    expect(() => networkRecordsToDevtoolsLog([{startTime: 1000, responseReceivedTime: 2000, timing: {sendEnd: 1200}}]))
      .toThrow(`request start (1000) plus relative timing value (1200) exceeds 'responseReceivedTime' (2000)`);
    expect(() => networkRecordsToDevtoolsLog([{rendererStartTime: 1000, responseReceivedTime: 2000, timing: {sendEnd: 1200}}]))
      .toThrow(`request start (1000) plus relative timing value (1200) exceeds 'responseReceivedTime' (2000)`);
    expect(() => networkRecordsToDevtoolsLog([{responseReceivedTime: 2000, timing: {requestTime: 1, sendEnd: 1200}}]))
      .toThrow(`request start (1000) plus relative timing value (1200) exceeds 'responseReceivedTime' (2000)`);

    expect(() => networkRecordsToDevtoolsLog([{startTime: 500, endTime: 2000, timing: {connectStart: 2200}}]))
      .toThrow(`request start (500) plus relative 'timing' value (2200) exceeds 'endTime' (2000)`);
    expect(() => networkRecordsToDevtoolsLog([{rendererStartTime: 500, endTime: 2000, timing: {connectStart: 2200}}]))
      .toThrow(`request start (500) plus relative 'timing' value (2200) exceeds 'endTime' (2000)`);
    expect(() => networkRecordsToDevtoolsLog([{endTime: 2000, timing: {requestTime: 0.5, connectStart: 2200}}]))
      .toThrow(`request start (500) plus relative 'timing' value (2200) exceeds 'endTime' (2000)`);

    expect(() => networkRecordsToDevtoolsLog([{startTime: 500, responseReceivedTime: 2000, timing: {receiveHeadersEnd: 500}}]))
      .toThrow(`request start (500) plus 'receiveHeadersEnd' (500) does not equal 'responseReceivedTime' (2000)`);
    expect(() => networkRecordsToDevtoolsLog([{responseReceivedTime: 2000, timing: {requestTime: 0.5, receiveHeadersEnd: 500}}]))
      .toThrow(`request start (500) plus 'receiveHeadersEnd' (500) does not equal 'responseReceivedTime' (2000)`);
    /* eslint-enable max-len */
  });
});
