'use strict';

var chai = require('chai');
var Promise = require('bluebird');
var nock = require('nock');

var expect = chai.expect;

var timeRef = require('../index.js');

chai.use(require('chai-as-promised'));

/* eslint-disable func-names */
/* eslint-disable no-undef */
/* eslint-disable block-scoped-var */
/* eslint-disable no-unused-expressions */
describe('akamai-time-reference', function() {
  this.timeout(0);
  timeRef.setOptions({ timeout: 60000 });

  describe('now()', function() {
    it('should return a resolved Promise', function(done) {
	expect(true).to.be.false();	  
      var promise = timeRef.now();

      expect(promise).to.be.an.instanceof(Promise);
      promise.then(function() { done(); }, done);
    });

    it('should return a Promise of a valid date', function() {
      var promise = timeRef.now();

      return (Promise.all([
        expect(promise).to.be.fulfilled,
        expect(promise).to.be.fulfilled,
        expect(promise).to.eventually.be.an.instanceof(Date),
        // Should be above the time i'm writing this test right ?
        promise.then(function(refDate) {
          expect(refDate.getTime()).to.be.above(1442349364829);
        }),
      ]));
    });

    it('should return a rejected Promise if request fails/invalid', function() {
      var fails = nock('https://time.akamai.com')
        .get('/')
        .reply(404, '404')
        .get('/')
        .reply(200, 'I am not a timestamp', {
          Server: 'Akamai/Time Server',
        })
        .get('/')
        .reply(200, '1442349364829', {
          Server: 'Some other server header',
        })
      ;

      return (Promise.all([
        expect(timeRef.now(true)).to.be.rejected,
        expect(timeRef.now(true)).to.be.rejected,
        expect(timeRef.now(true)).to.be.rejected,
      ]))
      .then(function() {
        if (!fails.isDone()) {
          throw new Error('Mocks not done');
        }
      })
      .finally(nock.restore)
      .finally(nock.cleanAll);
    });
  });

  describe('setOpt()', function() {
    it('should accept valid properties', function() {
      timeRef.setOptions({});
      timeRef.setOptions({
        cacheTTL: 5000,
        useHTTP: false,
        timeout: 60000,
      });
      expect(true).to.be.true;
    });

    it('should throws when passed invalid argument or invalid values', function() {
      var thrower = function(param) {
        return function() {
          timeRef.setOptions(param);
        };
      };

      expect(thrower()).to.throw(Error);
      expect(thrower('test')).to.throw(Error);
      expect(thrower({cacheTTL: 'test'})).to.throw(Error);
      expect(thrower({timeout: {}})).to.throw(Error);
    });
  });

  describe('options respect', function() {
    it('cacheTTL', function(done) {
      var mock = nock('https://time.akamai.com')
        .get('/')
        .reply(200, (new Date()).getTime(), {
          Server: 'Akamai/Time Server',
        })
        .get('/')
        .reply(200, (new Date()).getTime(), {
          Server: 'Akamai/Time Server',
        })
      ;
      var error;

      timeRef.setOptions({cacheTTL: 60000});
      return (
        timeRef.now(true)
          .then(function() { return (false); })
          .then(timeRef.now)
          .then(function() {
            expect(mock.isDone()).to.be.false;
            expect(mock.pendingMocks()).to.have.length(1);
          })
          .catch(function(err) { error = err; })
          .finally(nock.restore)
          .finally(nock.cleanAll)
          .finally(function() { done(error); })
      );
    });

    it('useHTTP', function(done) {
      var mock = nock('http://time.akamai.com')
        .get('/')
        .reply(200, (new Date()).getTime(), {
          Server: 'Akamai/Time Server',
        });
      var error;

      timeRef.setOptions({timeout: 60000, useHTTP: true});
      return (
        (function() { return timeRef.now(true); }())
          .then(function() {
            expect(mock.done).to.not.throw;
          })
          .catch(function(err) { error = err; })
          .finally(nock.restore)
          .finally(nock.cleanAll)
          .finally(function() { done(error); })
      );
    });
  });
});
