# EthGasMeter

This repository is my solution to the test task for employment as a Node.js Developer.

## Objective

Automatically notify a user when gas price on Ethereum drops below a specific USD threshold.

## Technical details

Application uses Telegram as both a User Interface and for notification purposes. Additional technological specifications:

* `Nest.js` - used as main framework
* `SQLite` - for persistence
* `telegraf` package - for Telegram integration

## Installation

```bash
$ npm install
```

## Running the app

Don't forget to set up `.env` file first as described in `.env.example`.

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```
