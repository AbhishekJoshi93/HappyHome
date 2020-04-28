# poper

[![NPM version](https://img.shields.io/npm/v/poper.svg?style=flat)](https://npmjs.com/package/poper) [![NPM downloads](https://img.shields.io/npm/dm/poper.svg?style=flat)](https://npmjs.com/package/poper) [![Build Status](https://img.shields.io/circleci/project/egoist/poper/master.svg?style=flat)](https://circleci.com/gh/egoist/poper) [![donate](https://img.shields.io/badge/$-donate-ff69b4.svg?maxAge=2592000&style=flat)](https://github.com/egoist/donate)

## Install

```bash
yarn add poper
```

## How does it work

It matches a starting comment `/* @@variable */` and an ending comment `/* variable@@ */`, finally it replaces the comments and content within using the `data` you provide. The `variable` supports dot path like `foo.deep.key`

## Usage

```js
const poper = require('poper')

const input = `
{
  hello: /* @@foo */ whatever.content(val) /* foo@@ */,
  there: /* @@bar */ what's this? /* bar@@ */
}
`

poper(input, {
  foo: 123,
  bar: 'hahaha'
}, {stringify: true})

//=> output:

{
  hello: 123,
  there: "hahaha"
}
```

## API

### poper(input, data, [options])

#### options

##### stringify

Type: `function`

Whether to replace matched content with stringified value using `JSON.stringify`.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D


## Author

**poper** © [egoist](https://github.com/egoist), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by egoist with help from contributors ([list](https://github.com/egoist/poper/contributors)).

> [egoistian.com](https://egoistian.com) · GitHub [@egoist](https://github.com/egoist) · Twitter [@rem_rin_rin](https://twitter.com/rem_rin_rin)
