# coseq

[![Build Status](https://travis-ci.org/MiguelCastillo/coseq.svg?branch=master)](https://travis-ci.org/MiguelCastillo/coseq)

Create iterable sequences with a small LINQ interface and support for *synchronous* and *asynchronous* iterators. Iteration is lazy, which means that items in a sequence are not read/evaluated until the data is needed. This allows for a really nice integration with infinite and/or really large data sets where eager evaluation and itermediate data storage is prohibitively expensive or impossible.

# features

- Lazy data evaluation
  - infinite data sequence
  - large data sets
- No intermediate arrays
- Asynchronous and synchronous iterators
  - Compatibility with `for await (var x of iterator)` and `for (var x of iterator)`


# usage

## install

```
$ npm install coseq --save
```

## api

### coseq

Method to create iterable sequences capable of building chains of high order functions to process your data.

Below is an example of filtering even numbers and multiplying the values by 2.

``` javascript
import coseq from 'coseq'

const set = new Set([1, 2, 3, 4]);

const sequence = coseq(set.values())
  .filter(value => value % 2)
  .map(value => value * 2)
  .delay(1000);

function runSequence() {
  for (var value of sequence) {
    console.log(value);
  }
}

runSequence();
```

The potential of coseq can be more easily experienced with infinite or really large data sets. *Generators are a good example of this.*


``` javascript
function* getItemsSync() {
  for (var i = 1; i <= 5000000; i++) {
    yield i;
  }

  return "YES!!";
}

const sequence = coseq(getItemsSync())
  .skip(500)
  .filter(value => value % 2)
  .map(value => value * 2);

function runSequence() {
  for (var value of sequence) {
    console.log(value);
  }
}

runSequence();
```

Below is a contrived example with *async generators*.

``` javascript
async function* getItemsAsync() {
  for (var i = 1; i <= 5000000; i++) {
    yield await i;
  }

  return "YES!!";
}

const sequence = coseq(getItemsAsync())
  .filter(value => value % 2)
  .map(value => value * 2);

async function runSequence() {
  for await (var value of sequence) {
    console.log(value);
  }
}

runSequence();
```

You can also await values in the sequence with the helper method `awaitValue`.

``` javascript
async function* getItemsAsync() {
  for (var i = 1; i <= 5000000; i++) {
    yield await Promise.resolve(i); // <== This yields promises that can be awaited with awaitValue
  }

  return "YES!!";
}

const sequence = coseq(getItemsAsync())
  .awaitValue() // <== This will await the promise yielded by the iterator
  .filter(value => value % 2)
  .map(value => value * 2);
```


### filter

Method to skip items in a sequence when the provided predicate returns falsy values.

> alias `where`

``` javascript
coseq(getItemsAsync()).filter(value => value % 2);
```

### map

Method to transform the current value in the sequence.

> alias `select`

``` javascript
coseq(getItemsAsync()).map(value => value * 2);
```

### forEach

Method to iterate through the items in a sequence. You can use this instead of the `for of` and `for await of` constructs.

> `forEach` runs asynchronously and returns a promise, which is particularly useful for accessing to the value returned by generator functions.

In the example below, all values are printed out in the `forEach`. And when the generator is all done generating values, the last `then` method in the chain will print `YES!!`;

``` javascript
async function* getItemsAsync() {
  for (var i = 1; i <= 5000000; i++) {
    yield await i;
  }

  return "YES!!";
}

coseq(getItemsAsync())
  .filter(value => value % 2)
  .map(value => value * 2)
  .forEach(value => console.log(result.value))
  .then(result => console.log(result.value));
```

### skip

Method to skip (discard) a specific number of items in a sequence.

The example below skips the first 3 items.

``` javascript
coseq(getItemsAsync()).skip(3);
```

### skipUntil

Method to skip (discard) items until the provided predicate function returns true. This is a one time operation so once the condition is true, `skipUntil` will no longer be executed.

The example below skips until the value is 3.

``` javascript
coseq(getItemsAsync()).skipUntil(value => value === 3);
```

### skipWhile

Method to skip (discard) items while the provided predicate function return true. This is a one time operation so once the condition is true, `skipWhile` will no longer be executed.

The example below skips while the value is 1.

``` javascript
coseq(getItemsAsync()).skipWhile(value => value === 1);
```

### awaitValue (async sequence only)

Method to await the current value. The primary use case for this is when a sequence yields a promise which needs to be awaited.

``` javascript
coseq(getItemsAsync())
  .awaitValue()
  .skipUntil(value => value === 2);
```

### delay (async sequence only)

Method to add a delay before continuing to process the current item in the sequence. The delay is sepecified in *milliseconds*.

``` javascript
coseq(getItemsAsync())
  .skipUntil(value => value === 2)
  .delay(3000);
```