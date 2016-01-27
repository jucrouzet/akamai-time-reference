[![Build Status](https://travis-ci.org/jucrouzet/akamai-time-reference.svg?branch=master)](https://travis-ci.org/jucrouzet/akamai-time-reference) [![npm version](https://badge.fury.io/js/akamai-time-reference.svg)](https://badge.fury.io/js/akamai-time-reference) [![Dependency Status](https://david-dm.org/jucrouzet/akamai-time-reference.svg)](https://david-dm.org/jucrouzet/akamai-time-reference)

# akamai-time-reference
-------

## What is this ?

`akamai-time-reference` is a Node.js package to get the exact current time using
[Akamai's Time Reference service](https://developer.akamai.com/stuff/Akamai_Time_Reference/AkamaiTimeReference.html).

It has only two depedencies :

- [bluebird](https://github.com/petkaantonov/bluebird)
- [request](https://github.com/request/request)

## What it isn't

- An [NTP](https://en.wikipedia.org/wiki/Network_Time_Protocol) client, see [ntp-client](https://www.npmjs.com/package/ntp-client)
- More generally, a solution to synchronize your local clock
- A banana

## How it works ?

```js
const timeRef = require('akamai-time-reference');

timeRef.now().then(function(now) {
  console.log(now);
});
// >> Tue Sep 15 2015 21:36:53 GMT+0200 (CEST)

timeRef.now().then(function(refNow) {
  console.log('Local clock desync ins ms : %d', Date.now() - refNow);
});
// >> Local clock desync ins ms : 12765
```

The `now()` function can be passed an argument, which, if true, will skip the cache (to force a HTTP request).

```js
const timeRef = require('akamai-time-reference');

timeRef.now();
// >> HTTP request
timeRef.now();
// >> NO HTTP request, used cache
timeRef.now(true);
// >> HTTP request
```

## Options

You can change some options like using `setOptions` by passing it an object with
one/some of theses properties :

```js
timeRef.setOptions({
  cacheTTL: 5000, // How often do we make a request to akamai, in ms (<=0 to disable)
  useHTTP: false, // Use the HTTP protocol instead of HTTP**S**
  timeout: 2000, // Request timeout value, in ms
});

// or just one :

timeRef.setOptions({ cacheTTL: 1000 });

```

(Above example gives you the default values).

Changing an/some options is done for every future calls (in the process), globally.

`setOptions` will return the current options (You can pass an empty object to just get them).
