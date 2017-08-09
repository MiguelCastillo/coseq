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
    return this.skipWhile(() => (count-- > 0));
  }

  skipUntil(predicate) {
    return this.skipWhile(value => !predicate(value));
  }

  skipWhile(predicate) {
    return new SkipWhileAction(this, predicate);
  }

  take(count) {
    return this.takeWhile(() => (count-- > 0));
  }

  takeUntil(predicate) {
    return new TakeUntilAction(this, predicate);
  }

  takeWhile(predicate) {
    return new TakeWhileAction(this, predicate);
  }

  forEach(cb) {
    var sequence = buildActionSequence(new ForEachAction(this, cb), asyncSequence);

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
    return buildActionSequence(this, syncSequence);
  }

  asyncIterator() {
    return buildActionSequence(this, asyncSequence);
  }

  [Symbol.iterator]() {
    return this.iterator();
  }

  [Symbol.asyncIterator]() {
    return this.asyncIterator();
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

class SkipWhileAction extends Action {
  constructor(prev, predicate) {
    super(prev, predicate);
    this._active = true;
  }

  exec(value, done) {
    if (this._active && this.fn(value)) {
      done({ skip: true });
    }
    else {
      this._active = false;
      done({ value });
    }
  }
}

class TakeUntilAction extends Action {
  constructor(prev, predicate) {
    super(prev, predicate);
    this._active = true;
  }

  exec(value, done) {
    if (this._active) {
      this._active = !this.fn(value);
      done({ value });
    }
    else {
      done({ done: true });
    }
  }
}

class TakeWhileAction extends Action {
  constructor(prev, predicate) {
    super(prev, predicate);
    this._active = true;
  }

  exec(value, done) {
    if (this._active && this.fn(value)) {
      done({ value });
    }
    else {
      this._active = false;
      done({ done: true });
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

  exec(value, done) {
    done(this.dataIter.next(value));
  }
}

function buildActionSequence(action, strategyFactory) {
  var next = null;

  while (action) {
    next = { next, action };
    action = action.prev;
  }

  return {
    next: strategyFactory({ next, done: false })
  };
}

function syncSequence(root) {
  function nextValue(next, result, initialValue) {
    while(!result.done && next) {
      next.action.exec(result.value, (r) => {
        result = r.skip ? { value: initialValue } : r;
        next = r.skip ? root.next : next.next;
      });
    }

    root.done = result.done = !!result.done;
    return result;
  }

  return (value) => root.done ? { done: true } : nextValue(root.next, { value }, value);
}

function asyncSequence(root) {
  function nextValue(next, result, initialValue) {
    if (result.done || !next) {
      root.done = result.done = !!result.done;
      return Promise.resolve(result);
    }

    return new Promise(resolve => next.action.exec(result.value, resolve))
      .then(result => result.skip ? nextValue(root.next, { value: initialValue }, initialValue) : nextValue(next.next, result, initialValue));
  }

  return (value) => root.done ? { done: true } : nextValue(root.next, { value }, value);
}

function coseq(dataIter) {
  return new RootAction(dataIter);
}

export default coseq;
