// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var app = express();
var muser = require('cloud/muser');
var mutil = require('cloud/mutil');
var _ = require('underscore');
var msign = require('cloud/msign');
var mchat = require('cloud/mchat');
var mlog = require('cloud/mlog');

// App 全局配置
app.set('views', 'cloud/views');   // 设置模板目录
app.set('view engine', 'ejs');    // 设置 template 引擎
app.use(express.bodyParser());    // 读取请求 body 的中间件

function setUserAvatar(req, res) {
  muser.findAllUsers().then(function (users) {
    mutil.findAll('Avatar').then(function (avatars) {
      var ps = [];
      _.each(users, function (user) {
        var len = avatars.length;
        var pos = Math.floor(len * Math.random());
        if (user.get('avatar') == null) {
          user.set('avatar', avatars[pos].get('file'));
          ps.push(user.save());
        }
      });
      AV.Promise.when(ps).then(function () {
        res.send('ok');
      }, mutil.renderErrorFn(res));
    });
  }, mutil.renderErrorFn(res));
}

function handlePromise(p, res) {
  p.then(function () {
    res.send('ok');
  }, mutil.renderErrorFn(res));
}

function convSignTest(req, res) {
  //open
  msign._convSign("selfId", null, null, null);
  //start
  msign._convSign("selfId", null, ["t1", "t2"], null);
  //add
  msign._convSign("selfId", "convid", ["t1", "t2"], "invite");
  //kick
  var result = msign._convSign("selfId", "convid", ["t1", "t2"], "kick");
  res.send(result);
}

function convSign(req, res) {
  var appId = req.query.appId;
  var masterKey = req.query.masterKey;
  var selfId = req.query.selfId;
  var convid = req.query.convid;
  var targetIds = req.query.targetIds;
  if (targetIds) {
    targetIds = targetIds.split(",");
  }
  var action =  req.query.action;
  var nonce = req.query.nonce;
  var timestamp = req.query.timestamp;
  var result = msign._convSign(selfId, convid, targetIds, action, appId, masterKey, nonce, timestamp);
  res.render('main',{result:JSON.stringify(result)});
}

function renderMainPage(req, res) {
   res.render('main');
}

function pushMessageTest(req, res) {
  var params = {content: '{"_lctype":-1,"_lctext":"sdfsdfsdf","_lcattrs":{"username":"lzwjava", "dev":true}}',
    fromPeer: '544f2a25e4b0e9dff2e9b272', offlinePeers: ['5416d9b2e4b0f645f29ddbfd'],
    conversationId: 'id'};
  res.send(mchat.getPushMessage(params));
}


function test(req, res) {
  res.send('ok');
}

if (__production == false) {
  app.get('/setAvatars', setUserAvatar);
  app.get('/convSignTest', convSignTest);
  app.get('/pushMessageTest', pushMessageTest);
  app.get('/test', test);
}

app.get('/convSign',convSign);

app.listen();