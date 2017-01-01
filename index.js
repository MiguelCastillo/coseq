/**
 * Helpers to iterate over generators that yield promises.
 */
class Action {
  constructor(prev, fn) {
    this.prev = prev;
    this.fn = fn;
  }

  awaitValue() {
    return new AwaitValueAction(this);
  }

  delay(timeout) {
    return new DelayAction(this, timeout);
  }

  filter(predicate) {
    return new FilterAction(this, predicate);
  }

  /** where - is the same as filter **/
  where(predicate) {
    return new FilterAction(this, predicate);
  }

  map(transform) {
    return new MapAction(this, transform);
  }

  /** select - is the same as map **/
  select(transform) {
    return new MapAction(this, transform);
  }

  skip(count) {
    return this.skipUntil(() => !(count-- > 0));
  }

  skipUntil(predicate) {
    return new SkipUntilAction(this, predicate);
  }

  forEach(cb) {
    var sequence = buildActionSequence(new ForEachAction(this, cb)).withStrategy(asyncSequence);

    return new Promise(resolve => {
      (function iterateSequence(root) {
        return Promise.resolve(root.next()).then((result) => result.done ? resolve(result) : iterateSequence(root));
      })(sequence);
    });
  }

  /**
   * Iterator API
   */
  iterator() {
    return buildActionSequence(this).withStrategy(syncSequence);
  }

  asyncIterator() {
    return buildActionSequence(this).withStrategy(asyncSequence);
  }

  [Symbol.iterator]() {
    return this.iterator();
  }

  [Symbol.asyncIterator]() {
    return this.asyncIterator();
  }

  /**
   * experimental pull sequence where each action in the chain will
   * ask its parent (preceeding) action for data. This is a recursive
   * process in which the end result does not build a sequence chain
   * and then execute. Instead the sequence is executed as the sequence
   * is being built.
   */
  pull(nextIter) {
    return this.prev ?
      this.prev.pull(new ActionIterator((value) => this.exec(value, nextIter))) :
      this.exec(undefined, nextIter);
  }
}


class ForEachAction extends Action {
  exec(value, done) {
    this.fn(value);
    done({});
  }
}

class MapAction extends Action {
  exec(value, done) {
    done({ value: this.fn(value) });
  }
}

class FilterAction extends Action {
  exec(value, done) {
    done({
      skip: !this.fn(value),
      value: value
    });
  }
}

class SkipUntilAction extends Action {
  constructor(prev, predicate) {
    super(prev, predicate);
    this._active = true;
  }

  exec(value, done) {
    if (this._active && !this.fn(value)) {
      done({ skip: true });
    }
    else {
      this._active = false;
      done({ value });
    }
  }
}

class AwaitValueAction extends Action {
  exec(value, done) {
    Promise.resolve(value).then(value => done({ value }));
  }
}

class DelayAction extends Action {
  constructor(prev, timeout) {
    super(prev);
    this._timeout = timeout;
  }

  exec(value, done) {
    setTimeout(() => done({ value }), this._timeout);
  }
}

class RootAction extends Action {
  constructor(dataIter) {
    super();
    this.dataIter = dataIter;
  }

  withStrategy(strategy) {
    this.strategy = strategy;
    return this;
  }

  exec(value, done) {
    return this.strategy(this.dataIter, value, done);
  }
}

class ActionIterator {
  constructor(action, next) {
    this.action = action;
    this.next = next;
  }

  withStrategy(strategy) {
    if (!(this.action instanceof RootAction)) {
      throw new TypeError("Only root actions can have a strategy");
    }

    this.action.withStrategy(strategy);
    return this;
  }
}

function buildActionSequence(action) {
  var root;

  /**
   * This is walking the list of method that process data backwards
   * to create a sequence that can be executed by pushing data from
   * one action to the next.
   */
  while (action) {
    root = new ActionIterator(action, createNext(action, root));
    action = action.prev;
  }

  return root;

  /**
   * The flow is relatively tanggled up. But the idea is that every
   * action in a chain, which together form a sequence of actions
   * can push values on from one action to the next by queueing up
   * their results. The result is queued in a RootAction, which knows
   * how to handle those new results. The reason for that is to ensure
   * we keep the stack as shallow as possible when executing the
   * sequence of actions.
   *
   * Building the sequence of actions also relies on the closure object
   * to keep around easy access to the RootAction so that we can do
   * fancy things like skip or filter items.
   */
  function createNext(action, iter) {
    return function next(value, queueResult = (v) => v) {
      return action.exec(value, function doneCallback(result) {
        return queueResult({
          done: !!result.done,
          iter: result.skip ? root : iter,
          value: result.value
        });
      });
    };
  }
}

function syncSequence(dataIter, value, init) {
  var result = dataIter.next(value);
  return result.done ? init(result) : pushValue(init(result));

  function pushValue(result) {
    while (result && result.iter && !result.done) {
      result.iter.next(result.value, (nextResult) => { result = nextResult; });
    }

    return result;
  }
}

function asyncSequence(dataIter, value, init) {
  return Promise
    .resolve(dataIter.next(value))
    .then((result) => result.done ? init(result) : pushValue(init(result)));

  function pushValue(result) {
    if (!result || !result.iter) {
      return result;
    }

    return new Promise(resolve => result.iter.next(result.value, resolve)).then(result => {
      return result.done ? result : pushValue(result);
    });
  }
}

function coseq(dataIter) {
  return new RootAction(dataIter);
}

export default coseq;
