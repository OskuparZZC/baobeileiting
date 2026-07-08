/**
 * 路由汇总
 * 将所有子路由挂载到统一前缀下
 */

const express = require('express');
const router = express.Router();

const healthRouter = require('./health');
const usersRouter = require('./users');
const recordsRouter = require('./records');
const bountiesRouter = require('./bounties');
const leaderboardRouter = require('./leaderboard');

// 挂载路由
router.use('/health', healthRouter);
router.use('/users', usersRouter);
router.use('/records', recordsRouter);
router.use('/bounties', bountiesRouter);
router.use('/leaderboard', leaderboardRouter);

module.exports = router;
