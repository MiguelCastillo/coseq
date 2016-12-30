import coseq from '../../index';
import { expect } from 'chai';

var syncIterator;

describe('sync sequence suite', function() {
  describe('Given an sync iterator', () => {
    var configureGenerator = () => {
      function* getItemsSync() {
        for (var i = 1; i <= 5; i++) {
          yield i;
        }

        return "YES!!";
      }

      syncIterator = getItemsSync();
    };

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

    describe('and calling iterator.next', () => {
      var iter;
      before(() => {
        configureGenerator();
        iter = syncIterator.next();
      });

      it('then iter.next returns an object', () => {
        expect(iter).to.be.a('object');
      });
    });

    describe('And filtering even numbers', () => {
      before(() => {
        configureGenerator();

        syncIterator = coseq
          .syncSequence(syncIterator)
          .filter(value => value % 2 === 0)
          .iterator();
      });

      assertNextValue(2, false);
      assertNextValue(4, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And multiplying even numbers by 4', () => {
      before(() => {
        configureGenerator();

        syncIterator = coseq
          .syncSequence(syncIterator)
          .filter(value => value % 2 === 0)
          .map(value => value * 4)
          .iterator();
      });

      assertNextValue(8, false);
      assertNextValue(16, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping the first 2 items and multiplying even numbers by 3', () => {
      before(() => {
        configureGenerator();

        syncIterator = coseq
          .syncSequence(syncIterator)
          .skip(2)
          .filter(value => value % 2 === 0)
          .map(value => value * 3)
          .iterator();
      });

      assertNextValue(12, false);
      assertNextValue('YES!!', true);
      assertNextValue(undefined, true);
    });

    describe('And skipping items until the value is 2', () => {
      before(() => {
        configureGenerator();

        syncIterator = coseq
          .syncSequence(syncIterator)
          .skipUntil(value => value === 2)
          .iterator();
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
    before(() => {
      result = syncIterator.next();
    });

    it(`then iterator returns ${value}`, () => {
      expect(result.value).to.equal(value);
    });

    it(`then iterator is ${done ? "" : "not"} done`, () => {
      expect(result.done).to.equal(done);
    });
  });
}
