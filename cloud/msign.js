/**
 * Created by lzw on 14/11/20.
 */
var common = require('cloud/common.js');

APPID = AV.applicationId;
MASTER_KEY = AV.masterKey;

function _convSign(selfId, convid, targetIds, action, appId, masterKey, nonce,ts) {
  if (targetIds == null) {
    targetIds = [];
  }
  targetIds.sort();
  if (!appId) {
    appId = APPID;
  }
  if (!masterKey) {
    masterKey = MASTER_KEY;
  }
  if (!ts){
    ts = parseInt(new Date().getTime() / 1000);
  }
  if (!nonce) {
    nonce = common.getNonce(5);
  }
  var content;
  if (convid) {
    content = [appId, selfId, convid, targetIds.join(':'), ts, nonce].join(':');
  } else {
    content = [appId, selfId, targetIds.join(':'), ts, nonce].join(':');
  }

  if (action) {
    content += ':' + action;
  }
  var sig = common.sign(content, masterKey);
  return {"nonce": nonce, "timestamp": ts, "signature": sig};
}

function convSign(request, response) {
  var selfId = request.params['self_id'];
  var convid = request.params['convid'];
  var targetIds = request.params['targetIds'];
  var action = request.params['action'];
  var result = _convSign(selfId, convid, targetIds, action);
  response.success(result);
}

module.exports = {
  _convSign: _convSign,
  convSign: convSign
};