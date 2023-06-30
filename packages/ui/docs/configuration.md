## Configuration

By default the application uses base configaration from `path_to_dist/server/configs/common.js` file. And it might be expanded by additional files throgh special variables:

- `APP_ENV` - if defined then tries to expand base config from `path_to_dist/server/config/{APP_ENV}.js`
- `APP_INSTALLATION` - if defined then tries to expand base config from:
  - `path_to_dist/server/config/{APP_INSTALLATION}/common.js`
  - `path_to_dist/server/config/{APP_INSTALLATION}/{APP_ENV}.js` (if APP_ENV is defined)

There are different options that allow to change behavior of the application.

How to use:

1. Set environment variable APP_INSTALLATION=cusom
2. Create path_to_dist/server/config/custom/common.js with some redefinitions:

```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
  someOption1: someValue;
  ...
}
```

#### UISettings

`uiSettings` object from config is passed to user's browser as is and might it be accessed as `window.__DATA__.uiSettings`.

##### `uiSettings.schedulingMonitoring`

```ts
{
  schedulingMonitoring: {urlTemplate: string; title?: string}
}
```

`schedulingMonitoring.urlTemplate` allows to define parametrized template of url for external monitoring dashbord of a pool.
If defined then `${title} ?? 'Monitoring'` tab will be present as a link generated from the template on a page of a pool.
The template supports following parameters: `{ytCluster}`, `{ytPool}`, `{ytPoolTree}`, all the parameters will be replaced with corresponiding values.
Example of usage:

```js
{
  uiSettings: {
    schedulingMonitoring: {
      urlTemplate:
        'https://my.monitoring.service/scheduling?cluster={ytCluster}&pool={ytPool}&tree={ytPoolTree}',
      title: 'My monitoring',
    },
  },
};
```

##### `uiSettings.accountsMonitoring`

```ts
{
  accountsMonitoring: {urlTemplate: string; title?: string}
}
```

`accountsMonitoring.urlTemplate` allows to define parametrized template of url for external monitoring dashbord of an account.
If defined then `${title} ?? 'Monitoring'` tab will be present as a link generated from the template on a page of a pool.
The template supports following parameters: `{ytCluster}`, `{ytAccount}`, all the parameters will be replaced with corresponiding values.
Example of usage:

```js
{
  uiSettings: {
    accountsMonitoring: {
      urlTemplate: 'https://my.monitoring.service/accounts?cluster={ytCluster}&account={ytAccount}',
      title: 'My monitoring',
    },
  },
};
```