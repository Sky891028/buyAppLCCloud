/**
 * Created by lzw on 14-9-29.
 */
var mutil = require('cloud/mutil');
var mlog = require('cloud/mlog');
var _ = require('underscore');
var Avatar = AV.Object.extend('nickname');
var userSheet = 'testsdfsdf';

function findUserById(userId, queryFn) {
  var q = new AV.Query(userSheet);
  console.log('finduserByID');
  console.log(q);
  if (queryFn) {
    queryFn(q);
  }
  return q.get(userId);
}

function findUser(modifyQueryFn) {
  return mutil.findOne(userSheet, modifyQueryFn);
}

function findUserByName(name) {
  return findUser(function (q) {
    q.equalTo('nickname', name);
  });
}

function findUsernameById(id) {
	
  console.log(id);
  var query = new AV.Query(userSheet);
  query.equalTo("objectId", id);
  query.find({
  	success: function(results) {
//    	 alert("Successfully retrieved " + results.length + " posts.");
   	 // 处理返回的结果数据
      var obj = results[0];
      var userNickName = obj.get('nickname');
      console.log(userNickName);
      return userNickName;
     }
  });
//   return "";
}
  
  
  

/*
  var p = new AV.Promise();
  findUserById(id).then(function (user) {
	  console.log(user);
    p.resolve(user.get('nickname'));
  }, function (error) {
    console.log(error.message);
    p.resolve();
  });
*/
/*
  return p;
}
*/

function findUsers(userIds) {	
	  console.log(userIds);

  var q = new AV.Query(userSheet);
  q.containedIn('objectId', userIds);
//  q.include('nickname');
  return q.find();
}

function findAllUsers(modifyQueryFn) {
  return mutil.findAll(userSheet, modifyQueryFn);
}

function unfollow(user, targetUser) {
  return user.unfollow(targetUser.id);
}

function afterDeleteFollowee(req) {
  var user = req.object.get('user');
  var followee = req.object.get('followee');
  if(user.id == req.user.id){
  console.log('执行了1');
    /*这里加个判断，否则会执行两次。因为第一个unfollow时，调用了此函数，此函数又调用了unfollow
 ，第二次引发afterDelete*/
    unfollow(followee, user).then(function () {
      console.log('unfollow succeed followee='+followee.id+' user='+user.id);
    }, mlog.cloudErrorFn);
  }else{
    // skip
  }
}

function unfollowTest(req, res) {
  unfollow(AV.Object.createWithoutData(userSheet, "5416d9b2e4b0f645f29ddbfd"),
    AV.Object.createWithoutData(userSheet, "54bc8c2de4b0644caaed25e3")).then(function () {
      res.success('ok');
    }, mlog.cloudErrorFn)
}

exports.findUser = findUser;
exports.findUserById = findUserById;
exports.findAllUsers = findAllUsers;
exports.findUsernameById = findUsernameById;
exports.findUsers = findUsers;
exports.afterDeleteFollowee=afterDeleteFollowee;
exports.unfollow=unfollow;
exports.unfollowTest=unfollowTest;
