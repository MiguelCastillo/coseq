# coseq

[![Build Status](https://travis-ci.org/MiguelCastillo/coseq.svg?branch=master)](https://travis-ci.org/MiguelCastillo/coseq)

Compose chains of functions to manipulate data via *synchronous and asynchronous iterators*. Data iteration is lazy, which means that items are not read/evaluated until the data is needed. This allows for a really nice integration with infinite and/or really large data sets where eager evaluation and itermediate data storage is prohibitively expensive or impossible.

> [async iterators](https://github.com/tc39/proposal-async-iteration) are a thing in JavaScript.

The first use case is around generators, which can create *asynchronous and synchrnous iterators*. You can craft generators to yield anything you want (more than once), in which case they are referred to as coroutines. Combining the coroutine nature of generators and the ability to iterate over the data they yield is why the name `coseq` came about. Not very creative - I know.

> subroutines return one value. coroutines can yield multiple values before running to completion.


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

Method that wraps an iterator to create chains of high order functions to process your data.

The contract with `coseq` is the [iterator protocol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols), which is why anything that can create an interator can be used with `coseq`. This includes `array`, `Set`, `Map`... etc.

Below is an example of filtering even numbers and multiplying the values by 2.

``` javascript
import coseq from 'coseq'

const set = new Set([1, 2, 3, 4]);

const sequence = coseq(set.values())
  .filter(value => value % 2)
  .map(value => value * 2);

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

### take

Method to read a specific number of items from a sequence. This is a one time operation so once the specified number of items are read, no further values will be processed.

The example below will pull the first 3 items

``` javascript
coseq(getItemsAsync()).take(3);
```

### takeUntil

Method to read items from a sequence until the predicate function returns true. This is a one time operation so once the condition is true, the sequence will no longer return values.

The example below will pull items until the value is equal to 2, including 2.

``` javascript
coseq(getItemsAsync()).takeUntil(value => value === 2);
```

### takeWhile

Method to read items from a sequence while the predicate function returns true. This is a one time operation so once the condition is no longer satisfied, the sequence will no longer return values.

The example below will pull items while the value is smaller or equal to 2

``` javascript
coseq(getItemsAsync()).takeWhile(value => value <= 2);
```

### skip

Method to skip (discard) a specific number of items in a sequence. This is a one time operation so once the specified number of items are read, no more items will be skipped.

The example below skips the first 3 items.

``` javascript
coseq(getItemsAsync()).skip(3);
```

### skipUntil

Method to skip (discard) items until the provided predicate function returns true. This is a one time operation so once the condition is true, `skipUntil` will no longer skip items.

The example below skips until the value is 3.

``` javascript
coseq(getItemsAsync()).skipUntil(value => value === 3);
```

### skipWhile

Method to skip (discard) items while the provided predicate function return true. This is a one time operation so once the condition is true, `skipWhile` will no longer skip items.

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