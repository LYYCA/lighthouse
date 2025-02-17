/**
 * @license Copyright 2017 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'interactive',
      'speed-index',
      'redirects',
    ],
    // Use provided throttling method to test usage of correct navStart.
    throttlingMethod: /** @type {const} */ ('provided'),
  },
};

/**
 * @type {Smokehouse.ExpectedRunnerResult}
 * Expected Lighthouse audit values for a site with multiple server-side redirects (3 x 1s).
 */
const expectations = {
  lhr: {
    requestedUrl: `http://localhost:10200/online-only.html?delay=1000&redirect_count=3&redirect=%2Fredirects-final.html`,
    finalDisplayedUrl: 'http://localhost:10200/redirects-final.html',
    audits: {
      'first-contentful-paint': {
        numericValue: '>=3000',
      },
      'interactive': {
        numericValue: '>=3000',
      },
      'speed-index': {
        numericValue: '>=3000',
      },
      'redirects': {
        score: '<1',
        details: {
          items: {
            length: 4,
          },
        },
      },
    },
    runWarnings: [
      /The page may not be loading as expected because your test URL \(.*online-only.html.*\) was redirected to .*redirects-final.html. Try testing the second URL directly./,
    ],
  },
};

export default {
  id: 'redirects-multiple-server',
  expectations,
  config,
};
