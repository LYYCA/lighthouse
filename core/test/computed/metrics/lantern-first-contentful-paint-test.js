/**
 * @license Copyright 2017 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import assert from 'assert/strict';

import {LanternFirstContentfulPaint} from '../../../computed/metrics/lantern-first-contentful-paint.js';
import {getURLArtifactFromDevtoolsLog, readJson} from '../../test-utils.js';
import {networkRecordsToDevtoolsLog} from '../../network-records-to-devtools-log.js';
import {createTestTrace} from '../../create-test-trace.js';

const trace = readJson('../../fixtures/traces/progressive-app-m60.json', import.meta);
const devtoolsLog = readJson('../../fixtures/traces/progressive-app-m60.devtools.log.json', import.meta);

describe('Metrics: Lantern FCP', () => {
  const gatherContext = {gatherMode: 'navigation'};

  it('should compute predicted value', async () => {
    const settings = {};
    const context = {settings, computedCache: new Map()};
    const URL = getURLArtifactFromDevtoolsLog(devtoolsLog);
    const result = await LanternFirstContentfulPaint.request({trace, devtoolsLog, gatherContext,
      settings, URL}, context);

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    }).toMatchSnapshot();
    assert.equal(result.optimisticEstimate.nodeTimings.size, 3);
    assert.equal(result.pessimisticEstimate.nodeTimings.size, 3);
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });

  it('should handle negative request endTime', async () => {
    const settings = {};
    const context = {settings, computedCache: new Map()};
    const devtoolsLog = networkRecordsToDevtoolsLog([
      {
        transferSize: 2000,
        url: 'https://example.com/', // Main document (always included).
        resourceType: 'Document',
        priority: 'High',
        startTime: 0,
        endTime: 1000,
        timing: {sslStart: 50, sslEnd: 100, connectStart: 50, connectEnd: 100},
      },
      {
        transferSize: 2000,
        url: 'https://example.com/script.js',
        resourceType: 'Script',
        priority: 'High',
        startTime: 1000, // After FCP.
        endTime: -1,
        timing: {sslStart: 50, sslEnd: 100, connectStart: 50, connectEnd: 100},
      },
    ]);
    const trace = createTestTrace({timeOrigin: 0, traceEnd: 2000});
    const URL = {
      requestedUrl: 'https://example.com/',
      mainDocumentUrl: 'https://example.com/',
      finalDisplayedUrl: 'https://example.com/',
    };
    const artifacts = {
      trace,
      devtoolsLog,
      gatherContext,
      settings,
      URL,
    };
    const result = await LanternFirstContentfulPaint.request(artifacts, context);

    const optimisticNodes = [];
    result.optimisticGraph.traverse(node => optimisticNodes.push(node));
    expect(optimisticNodes.map(node => node._record.url)).toEqual(['https://example.com/']);

    const pessimisticNodes = [];
    result.pessimisticGraph.traverse(node => pessimisticNodes.push(node));
    expect(pessimisticNodes.map(node => node._record.url)).toEqual(['https://example.com/']);
  });
});
