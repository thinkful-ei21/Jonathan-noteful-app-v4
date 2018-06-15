'use strict';

const app = require('../server.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const { TEST_MONGODB_URI} = require('../config');

const User = require('../models/user');
const seedUsers = require('../db/seed/users');

const expect = chai.expect;
chai.use(chaiHttp);

describe('Noteful API - Login', () => {

  before(() => {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(() => {
    return Promise.all([
      User.insertMany(seedUsers),
      User.createIndexes()
    ]);
  });

  afterEach(() => {
    return mongoose.connection.db.dropDatabase();
  });

  after(() => {
    return mongoose.disconnect();
  });

  describe('POST /api/login',  () => {
    it('should return a token', ()=> {
      return User.findOne()
        .then ((res) => {
          const username = res.username;
          const password = 'password';
          return chai.request(app).post('/api/login').send({username, password});
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.all.keys('authToken');
          expect(res.body.authToken).to.be.a('string');
        });
    });

    it('should return status 400 for missing credentials', () => {
      return chai.request(app).post('/api/login').send({})
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Bad Request');
          expect(res.body.name).to.equal('AuthenticationError');
        });
    });

    it('should return status 400 for empty string as username', () => {
      return chai.request(app).post('/api/login').send({username: '', password:'password'})
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Bad Request');
          expect(res.body.name).to.equal('AuthenticationError');
        });
    });

    it('should return status 400 for empty string as password', () => {
      return chai.request(app).post('/api/login').send({username: 'bobuser', password: ''})
        .then(res => {
          expect(res).to.have.status(400);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Bad Request');
          expect(res.body.name).to.equal('AuthenticationError');
        });
    });

    it('should return status 401 for invalid username', () => {
      return chai.request(app).post('/api/login').send({username:'NOT-A-USER', password: 'password'})
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Unauthorized');
          expect(res.body.name).to.equal('AuthenticationError');
        });
    });

    it('should return status 401 for invalid password', () => {
      return chai.request(app).post('/api/login').send({username:'bobuser', password: 'INVALID'})
        .then(res => {
          expect(res).to.have.status(401);
          expect(res.body).to.be.an('object');
          expect(res.body.message).to.equal('Unauthorized');
          expect(res.body.name).to.equal('AuthenticationError');
        });
    });

  });
  
});


