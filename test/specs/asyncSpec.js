import coseq from '../../index';
import { expect } from 'chai';

var asyncIterator;


describe('async sequence suite', function() {
  describe('Given an interator from a Set', () => {
    before(() => {
      var set = new Set([1, 2, 3, 4, 5]);
      asyncIterator = coseq(set.values()).asyncIterator();
    });

    assertNextValue(1, false);
    assertNextValue(2, false);
    assertNextValue(3, false);
    assertNextValue(4, false);
    assertNextValue(5, false);
    assertNextValue(undefined, true);
  });

  describe('Given an interator from a Map', () => {
    before(() => {
      var map = new Map([1, 2, 3, 4, 5].entries());
      asyncIterator = coseq(map.values()).asyncIterator();
    });

    assertNextValue(1, false);
    assertNextValue(2, false);
    assertNextValue(3, false);
    assertNextValue(4, false);
    assertNextValue(5, false);
    assertNextValue(undefined, true);
  });

  describe('Given an interator from an array', () => {
    before(() => {
      var array = [1, 2, 3, 4, 5][Symbol.iterator]();
      asyncIterator = coseq(array).asyncIterator();
    });

    assertNextValue(1, false);
    assertNextValue(2, false);
    assertNextValue(3, false);
    assertNextValue(4, false);
    assertNextValue(5, false);
    assertNextValue(undefined, true);
  });

  describe('Given a sync iterator with async value', () => {
    var configureGenerator = () => {
      function* getItemsAsync() {
        for (var i = 1; i <= 5; i++) {
          yield Promise.resolve(i);
        }

        return "YES!!";
      }

      asyncIterator = getItemsAsync();
    };

    describe('and calling iterator.next', () => {
      var iter;
      before(() => {
        configureGenerator();
        iter = asyncIterator.next();
      });

      it('then iter.next returns an object', () => {
        expect(iter).to.be.a('object');
      });

      it('then iter.next.value is a promise', () => {
        expect(iter.value).to.be.a('promise');
      });
    });

    describe('And awaiting each value', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .awaitValue()
          .asyncIterator();
      });

      assertNextValue(1, false);
      assertNextValue(2, false);
      assertNextValue(3, false);
      assertNextValue(4, false);
      assertNextValue(5, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And filtering even numbers', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .awaitValue()
          .filter(value => value % 2 === 0)
          .asyncIterator();
      });

      assertNextValue(2, false);
      assertNextValue(4, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And multiplying by 2', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .awaitValue()
          .map(value => value * 2)
          .asyncIterator();
      });

      assertNextValue(2, false);
      assertNextValue(4, false);
      assertNextValue(6, false);
      assertNextValue(8, false);
      assertNextValue(10, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });
  });


  describe('Given an async iterator', () => {
    var configureGenerator = () => {
      async function* getItemsAsync() {
        for (var i = 1; i <= 5; i++) {
          yield await Promise.resolve(i);
        }

        return "YES!!";
      }

      asyncIterator = getItemsAsync();
    };

    describe('and calling iterator.next', () => {
      var iter;
      before(() => {
        configureGenerator();
        iter = asyncIterator.next();
      });

      it('then iter.next returns a promise', () => {
        expect(iter).to.be.a('promise');
      });
    });

    describe('when the iterator generates 5 items', () => {
      before(() => {
        configureGenerator();
      });

      assertNextValue(1, false);
      assertNextValue(2, false);
      assertNextValue(3, false);
      assertNextValue(4, false);
      assertNextValue(5, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And filtering even numbers', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .filter(value => value % 2 === 0)
          .asyncIterator();
      });

      assertNextValue(2, false);
      assertNextValue(4, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And multiplying by 2', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .map(value => value * 2)
          .asyncIterator();
      });

      assertNextValue(2, false);
      assertNextValue(4, false);
      assertNextValue(6, false);
      assertNextValue(8, false);
      assertNextValue(10, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping the first 3', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .skip(3)
          .asyncIterator();
      });

      assertNextValue(4, false);
      assertNextValue(5, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping until value is 2', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .skipUntil(value => value === 2)
          .asyncIterator();
      });

      assertNextValue(2, false);
      assertNextValue(3, false);
      assertNextValue(4, false);
      assertNextValue(5, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping all values', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .skipUntil(value => value === 6)
          .asyncIterator();
      });

      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });


    describe('And multiplying even numbers by 4', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .filter(value => value % 2 === 0)
          .map(value => value * 4)
          .asyncIterator();
      });

      assertNextValue(8, false);
      assertNextValue(16, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping the first 2 items and multiplying even numbers by 3', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .skip(2)
          .filter(value => value % 2 === 0)
          .map(value => value * 3)
          .asyncIterator();
      });

      assertNextValue(12, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping items until the value is 2', () => {
      before(() => {
        configureGenerator();

        asyncIterator = coseq(asyncIterator)
          .skipUntil(value => value === 2)
          .asyncIterator();
      });

      assertNextValue(2, false);
      assertNextValue(3, false);
      assertNextValue(4, false);
      assertNextValue(5, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });
  });
});


function assertNextValue(value, done) {
  var result;
  describe('and getting the next value', () => {
    before(async () => {
      result = await asyncIterator.next();
    });

    it(`then iterator returns ${value}`, () => {
      expect(result.value).to.equal(value);
    });

    it(`then iterator is ${done ? "" : "not"} done`, () => {
      expect(result.done).to.equal(done);
    });
  });
}
