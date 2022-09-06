<!---
TODO(rm-legacy): Remove this when legacy path is gone.
-->
> **WARNING**: This config format is for configs in version 10.0 and beyond. Please read the [legacy config](#legacy-configs) section if you are using the old config format.

# Lighthouse Configuration

The Lighthouse config object is the primary method of customizing Lighthouse to suit your use case. Using a custom config, you can limit the audits to run, add additional loads of the page under special conditions, add your own custom checks, tweak the scoring, and more.

Read more about the [architecture of Lighthouse](./architecture.md).

## Usage

You can specify a custom config file when using Lighthouse through the CLI or consuming the npm module yourself.

**custom-config.js file**
```js
export default {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-meaningful-paint',
      'speed-index',
      'interactive',
    ],
  },
};
```

**Use config file via CLI**
```sh
lighthouse --config-path=path/to/custom-config.js https://example.com
```

**Use config file via Node**
```js
import lighthouse from 'lighthouse';
import config from './path/to/custom-config.js';
await lighthouse('https://example.com/', {port: 9222}, config);
```

## Properties

| Name | Type | |
| - | - | - |
| extends | <code>string&#124;undefined</code> |
| settings | <code>Object&#124;undefined</code> |
| passes | <code>Object[]</code> |
| audits | <code>string[]</code> |
| categories | <code>Object&#124;undefined</code> |
| groups | <code>Object&#124;undefined</code> |
| plugins | <code>string[]</code> | Includes plugins and their audits. Refer to the [plugin documentation](https://github.com/GoogleChrome/lighthouse/blob/master/docs/plugins.md) for details.|

### `extends: "lighthouse:default"|undefined`

The `extends` property controls if your configuration should inherit from the default Lighthouse configuration. [Learn more.](#config-extension)

#### Example
```js
{
  extends: 'lighthouse:default',
}
```

### `settings: Object|undefined`

The settings property controls various aspects of running Lighthouse such as CPU/network throttling and which audits should run.

#### Example
```js
{
  settings: {
    onlyCategories: ['performance'],
    onlyAudits: ['works-offline'],
  }
}
```

#### Options
For full list see [our config settings typedef](https://github.com/GoogleChrome/lighthouse/blob/575e29b8b6634bfb280bc820efea6795f3dd9017/types/externs.d.ts#L141-L186).

| Name | Type | Description |
| -- | -- | -- |
| onlyCategories | `string[]` | Includes only the specified categories in the final report. Additive with `onlyAudits` and reduces the time to audit a page. |
| onlyAudits | `string[]` | Includes only the specified audits in the final report. Additive with `onlyCategories` and reduces the time to audit a page. |
| skipAudits | `string[]` | Excludes the specified audits from the final report. Takes priority over `onlyCategories`, not usable in conjuction with `onlyAudits`, and reduces the time to audit a page. |

### `artifacts: Object[]`

The list of artifacts to collect on a single Lighthouse run. This property is required and on extension will be concatenated with the existing set of artifacts.

```js
{
  artifacts: [
    {id: 'Accessibility', gatherer: 'accessibility'},
    {id: 'AnchorElements', gatherer: 'anchor-elements'},
  ]
}
```

| Name | Type | Description |
| -- | -- | -- |
| id | `string` | Unique identifier for this artifact. This is how the artifact is referenced in audits. |
| gatherer | `string` | Gatherer used to produce this artifact. Does not need to be unique within the `artifacts` list. |

### `audits: string[]`

The audits property controls which audits to run and include with your Lighthouse report. See [more examples](#more-examples) to see how to add custom audits to your config.

#### Example
```js
{
  audits: [
    'first-contentful-paint',
    'byte-efficiency/uses-optimized-images',
  ]
}
```

### `categories: Object|undefined`

The categories property controls how to score and organize the audit results in the report. Each category defined in the config will have an entry in the `categories` property of Lighthouse's output. The category output contains the child audit results along with an overall score for the category.

**Note:** many modules consuming Lighthouse have no need to group or score all the audit results; in these cases, it's fine to omit a categories section.

#### Example
```js
{
  categories: {
    performance: {
      title: 'Performance',
      description: 'This category judges your performance',
      auditRefs: [
        {id: 'first-meaningful-paint', weight: 2, group: 'metrics'},
        {id: 'first-contentful-paint', weight: 3, group: 'metrics'},
        {id: 'interactive', weight: 5, group: 'metrics'},
      ],
    }
  }
}
```

#### Options
| Name | Type | Description |
| -- | -- | -- |
| title | `string` | The display name of the category. |
| description | `string` | The displayed description of the category. |
| supportedModes | `string[]` (optional, [user flows](https://github.com/GoogleChrome/lighthouse/blob/master/docs/user-flows.md)) | The modes supported by the category. Category will support all modes if this is not provided. |
| auditRefs | `Object[]` | The audits to include in the category. |
| auditRefs[$i].id | `string` | The ID of the audit to include. |
| auditRefs[$i].weight | `number` | The weight of the audit in the scoring of the category. |
| auditRefs[$i].group | `string` (optional) | The ID of the [display group](#groups-objectundefined) of the audit. |

### `groups: Object|undefined`

The groups property controls how to visually group audits within a category. For example, this is what enables the grouped rendering of metrics and accessibility audits in the report.

**Note: The report-renderer has display logic that's hardcoded to specific audit group names. Adding arbitrary groups without additional rendering logic may not perform as expected.**

#### Example
```js
{
  categories: {
    performance: {
      auditRefs: [
        {id: 'my-performance-metric', weight: 2, group: 'metrics'},
      ],
    }
  },
  groups: {
    'metrics': {
      title: 'Metrics',
      description: 'These metrics encapsulate your web app\'s performance across a number of dimensions.'
    },
  }
}
```

## Config Extension

The stock Lighthouse configurations can be extended if you only need to make small tweaks, such as adding an audit or skipping an audit, but wish to still run most of what Lighthouse offers. When adding the `extends: 'lighthouse:default'` property to your config, the default passes, audits, groups, and categories will be automatically included, allowing you modify settings or add additional audits to a pass.

Please note that the `extends` property only supports extension of `lighthouse:default`. Other internal configs found in the [core/config](https://github.com/GoogleChrome/lighthouse/tree/main/core/config) directory can be used by importing the config object from file reference, or by using the [`--preset`](https://github.com/GoogleChrome/lighthouse#cli-options) CLI flag.

See [more examples below](#more-examples) to view different types of extensions in action.

**Config extension is the recommended way to run custom Lighthouse**. If there's a use case that extension doesn't currently solve, we'd love to [hear from you](https://github.com/GoogleChrome/lighthouse/issues/new)!

## More Examples

The best examples are the ones Lighthouse uses itself! There are several reference configuration files that are maintained as part of Lighthouse.

* [core/config/default-config.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js)
* [core/config/lr-desktop-config.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/lr-desktop-config.js)
* [core/config/lr-mobile-config.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/lr-mobile-config.js)
* [core/config/perf-config.js](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/perf-config.js)
* [docs/recipes/custom-audit/custom-config.js](https://github.com/GoogleChrome/lighthouse/blob/main/docs/recipes/custom-audit/custom-config.js)
* [pwmetrics](https://github.com/paulirish/pwmetrics/blob/v4.1.1/lib/perf-config.ts)

## Legacy Configs

Older versions of Lighthouse (pre-10.0) use a slightly different config format. The biggest difference is that the new configs do not include `passes`. If you want to load a page multiple times, we recommend creating a [user flow](https://github.com/GoogleChrome/lighthouse/blob/main/docs/user-flows.md).

- v9 configuration docs: https://github.com/GoogleChrome/lighthouse/blob/branch-9/docs/configuration.md

### `passes: Object[]`

The passes property controls how to load the requested URL and what information to gather about the page while loading. Each entry in the passes array represents one load of the page (e.g. 4 entries in `passes` will load the page 4 times), so be judicious about adding multiple entries here to avoid extending run times.

Each `passes` entry defines basic settings such as how long to wait for the page to load and whether to record a trace file. Additionally a list of **gatherers** to use is defined per pass. Gatherers can read information from the page to generate artifacts which are later used by audits to provide you with a Lighthouse report. For more information on implementing a custom gatherer and the role they play in building a Lighthouse report, refer to the [recipes](https://github.com/GoogleChrome/lighthouse/blob/main/docs/recipes/custom-audit). Also note that `artifacts.devtoolsLogs` will be automatically populated for every pass. Gatherers also have access to this data within the `afterPass` as `traceData.devtoolsLog` (However, most will find the higher-level `traceData.networkRecords` more useful).

For list of default pass values, see [our config constants](https://github.com/GoogleChrome/lighthouse/blob/main/core/config/constants.js).

#### Example
```js
{
  passes: [
    {
      passName: 'fastPass',
      gatherers: ['fast-gatherer'],
    },
    {
      passName: 'slowPass',
      recordTrace: true,
      useThrottling: true,
      networkQuietThresholdMs: 5000,
      gatherers: ['slow-gatherer'],
    }
  ]
}
```

#### Options
| Name | Type | Description |
| -- | -- | -- |
| passName | `string` | A unique identifier for the pass used in audits and during config extension. |
| recordTrace | `boolean` | Records a [trace](https://github.com/GoogleChrome/lighthouse/blob/main/docs/architecture.md#understanding-a-trace) of the pass when enabled. Available to gatherers during `afterPass` as `traceData.trace` and to audits in `artifacts.traces`. |
| useThrottling | `boolean` | Enables throttling of the pass when enabled. |
| pauseAfterLoadMs | `number` | The number of milliseconds to wait after the load event before the pass can continue. Used to ensure the page has had time for post-load JavaScript to execute before ending a trace. (Default: 0) |
| networkQuietThresholdMs | `number` | The number of milliseconds since the last network request to wait before the page should be considered to have reached 'network quiet'. Used to ensure the page has had time for the full waterfall of network requests to complete before ending a trace. (Default: 5000) |
| pauseAfterNetworkQuietMs | `number` | The number of milliseconds to wait after 'network quiet' before the pass can continue. Used to ensure the page has had time for post-network-quiet JavaScript to execute before ending a trace. (Default: 0) |
| blockedUrlPatterns | `string[]` | URLs of requests to block while loading the page. Basic wildcard support using `*`.  |
| gatherers | `string[]` | The list of gatherers to run on this pass. This property is required and on extension will be concatenated with the existing set of gatherers. |

### Migrating to 10.0 format

1. Combine the gatherer lists in [`config.passes`](#passes-object) into [`config.artifacts`](#artifacts-object), giving each artifact a unique ID.
1. Remove [`config.passes`](#passes-object) property. Pass properties such as `pauseAfterLoadMs` are defined on `config.settings` in 10.0 configs.

### Using legacy configs in 10.0

The old config format can still be used in 10.0 but it's behind a separate path in the CLI and Node API.

**Use config file via CLI**
```sh
lighthouse --legacy-navigation --config-path=path/to/custom-config.js https://example.com
```

**Use config file via Node**
```js
import {legacyNavigation} from 'lighthouse';
import config from './path/to/custom-config.js';
await legacyNavigation('https://example.com/', {port: 9222}, config);
```
