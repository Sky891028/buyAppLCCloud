/*eslint strict:false */

// 请将 AppId 改为你自己的 AppId，否则无法本地测试
var appId = 'x3o016bxnkpyee7e9pa5pre6efx2dadyerdlcez0wbzhw25g';

var appKey = '057x24cfdzhffnl3dzk14jh9xo2rq6w1hy1fdzt5tv46ym78';

AV.initialize(appId, appKey);

// 用来存储 realtimeObject
var rt;

// 用来存储创建好的 roomObject
var room;

var cachedUsers = {};

// 监听是否服务器连接成功
var firstFlag = true;

// 用来标记历史消息获取状态
var logFlag = false;

var convLoadingFlag = false;

var openBtn = document.getElementById('open-btn');
var sendBtn = document.getElementById('send-btn');
var logoutBtn = document.getElementById('logout-btn');

var inputName = document.getElementById('input-name');
var inputPassword = document.getElementById('input-password');
var inputSend = document.getElementById('input-send');

var convlist = document.getElementById('conv-list');
var printWall = document.getElementById('print-wall');

var loginItem = document.getElementById('login-item');
var logoutItem = document.getElementById('logout-item');

// 拉取历史相关
// 最早一条消息的时间戳
var msgTime;
bindEvent(openBtn, 'click', main);
bindEvent(sendBtn, 'click', sendMsg);
bindEvent(logoutBtn, 'click', logout);

bindEvent(document.body, 'keydown', function (e) {
    if (e.keyCode === 13) {
        if (firstFlag) {
            main();
        } else {
            sendMsg();
        }
    }
});

function main() {
    showLog('正在链接服务器，请等待。。。');
    var username = inputName.value;
    var password = inputPassword.value;
    if (!username || !password) {
        showLog('请输入用户名和密码');
        return;
    }
    login(username, password);
}

function logout() {
    AV.User.logOut();
    location.reload();
}

function login(username, password) {
    AV.User.logIn(username, password).then(function (user) {
        location.reload();
    }, function (error) {
        console.dir(error);
        showLog(error.message);
    });
}

function loginSucceed(user) {
    showLog(user.get('username') + ' 登录成功');
    cachedUsers[user.id] = user;
    initRealtime(user.id);
}

function initConvList() {
    while (convlist.firstChild) {
        convlist.removeChild(convlist.firstChild);
    }
    rt.query({
        where: {
            m: rt.cache.options.peerId
        },
        sort: '-lm',
        limit: 15
    }, function (convs) {
        console.dir(convs);
        var userIds = [];
        var i;
        for (i = 0; i < convs.length; i++) {
            var conv = convs[i];
            if (conv.m.length === 2) {
                if (userIds.indexOf(getOtherIdOfConv(conv)) === -1) {
                    userIds.push(getOtherIdOfConv(conv));
                }
            }
        }
        cacheUsersByIds(userIds).then(function () {
            var firstLi;
            for (i = 0; i < convs.length; i++) {
                var name;
                if (convs[i].m.length === 2) {
                    var user = cachedUsers[getOtherIdOfConv(convs[i])];
                    console.dir(user);
                    name = user.get('username');
                } else {
                    name = convs[i].name;
                }
                var p = document.createElement('li');
                p.id = convs[i].objectId;
                p.innerHTML = name;
                bindEvent(p, 'click', clickConv);
                convlist.appendChild(p);
                if (i === 0) {
                    firstLi = p;
                }
            }
            if (firstLi) {
                firstLi.click();
            }
        }, handleError);
    });
}


function cacheUsersByIds(userIds) {
    var uncachedIds = [];
    userIds.forEach(function (userId) {
        if (!cachedUsers[userId]) {
            uncachedIds.push(userId);
        }
    });
    var p = new AV.Promise();
    var query = new AV.Query(AV.User);
    query.containedIn('objectId', uncachedIds);
    query.find().then(function (users) {
        users.forEach(function (user) {
            cachedUsers[user.id] = user;
        });
        p.resolve();
    }, function (error) {
        p.reject(error);
    });
    return p;
}

function namesByUserIds(userIds) {
    var names = [];
    userIds.forEach(function (userId) {
        names.push(cachedUsers[userId].get('username'));
    });
    return names;
}

function clickConv(event) {
    var lis = event.target.parentNode.children;
    $('li').removeClass('conv-list-selected');
    var convid = event.target.id;
    $(event.target).addClass('conv-list-selected');
    initRoomAndChat(convid);
}

function getOtherIdOfConv(conv) {
    if (conv.m[0] === rt.cache.options.peerId) {
        return conv.m[1];
    } else {
        return conv.m[0];
    }
}

function initRoomAndChat(roomId) {
    if (!roomId) {
        showLog('请选择 room');
        return;
    }
    if (convLoadingFlag) {
        return;
    }
    convLoadingFlag = true;
    // remove all elements
    while (printWall.firstChild) {
        printWall.removeChild(printWall.firstChild);
    }
    msgTime = null;
    rt.room(roomId, function (theRoom) {
        if (theRoom) {
            // 获取成员列表
            theRoom.list(function (data) {
                room = theRoom;
                if (data.indexOf(rt.cache.options.peerId) === -1) {
                    showLog('此对话成员不包含你，无法加入');
                    convLoadingFlag = false;
                    return;
                }
                cacheUsersByIds(data).then(function () {
                    showLog('当前 Conversation 的成员列表：', namesByUserIds(data));
                    // 获取在线的 client（Ping 方法每次只能获取 20 个用户在线信息）
                    rt.ping(data.slice(0, 20), function (list) {
                        showLog('当前在线的成员列表：', namesByUserIds(list));
                    });
//                var l = data.length;
//                // 如果超过 500 人，就踢掉一个。
//                if (l > 490) {
//                    room.remove(data[30], function () {
//                        showLog('人数过多，踢掉： ', data[30]);
//                    });
//                }
                    // 获取聊天历史
                    getLog(function () {
                        printWall.scrollTop = printWall.scrollHeight;
                        convLoadingFlag = false;
                    });
                    // 房间接受消息
                    room.receive(function (message) {
                        if (!msgTime) {
                            // 存储下最早的一个消息时间戳
                            msgTime = message.timestamp;
                        }
                        if (message.cid === room.id) {
                            cacheUsersByIds([message.fromPeerId]).then(function () {
                                showMsg(message);
                                printWall.scrollTop = printWall.scrollHeight;
                            }, handleError);
                        }
                    });
                }, function (error) {
                    showLog(error.message);
                    convLoadingFlag = false;
                });
            });

        } else {
            showLog('服务器不存在这个 conversation');
            convLoadingFlag = false;
//            showLog('服务器不存在这个 conversation，你需要创建一个。');
//
//            // 创建一个新 room
//            rt.room({
//                // Room 的默认名字
//                name: 'LeanCloud-Room',
//
//                // 默认成员的 clientId
//                members: [
//                    // 当前用户
//                    clientId
//                ],
//                // 创建暂态的聊天室（暂态聊天室支持无限人员聊天，但是不支持存储历史）
//                // transient: true,
//                // 默认的数据，可以放 Conversation 名字等
//                attr: {
//                    test: 'demo2'
//                }
//            }, function (obj) {
//
//                // 创建成功，后续你可以将 room id 存储起来
//                room = obj;
//                roomId = room.id;
//                showLog('创建一个新 Room 成功，id 是：', roomId);
//
//                // 关闭原连接，重新开启新连接
//                rt.close();
//                main();
//            });
        }
    });
}

function initRealtime(clientId) {
    if (!firstFlag) {
        rt.close();
    }

    // 创建实时通信实例
    rt = AV.realtime({
        appId: appId,
        clientId: clientId,

        // 请注意，这里关闭 secure 完全是为了 Demo 兼容范围更大些
        // 具体请参考实时通信文档中的「其他兼容问题」部分
        // 如果真正使用在生产环境，建议不要关闭 secure，具体阅读文档
        // secure 设置为 true 是开启
        secure: false
    });

    // 监听连接成功事件
    rt.on('open', function () {
        firstFlag = false;
        showLog('服务器连接成功！');
        initConvList();
    });

    // 监听服务情况
    rt.on('reuse', function () {
        showLog('服务器正在重连，请耐心等待。。。');
    });

    // 监听错误
    rt.on('error', function (error) {
        console.dir(error);
        showLog('连接遇到错误。。。');
    });
}

function sendMsg() {

    // 如果没有连接过服务器
    if (firstFlag) {
        alert('请先连接服务器！');
        return;
    }
    var val = inputSend.value;

    // 不让发送空字符
    if (!String(val).replace(/^\s+/, '').replace(/\s+$/, '')) {
        alert('请输入点文字！');
        return;
    }

    if (!room) {
        showLog('请先选择对话');
        return;
    }

    // 向这个房间发送消息，这段代码是兼容多终端格式的，包括 iOS、Android、Window Phone
    room.send({
        text: val
    }, {
        type: 'text'
    }, function (data) {

        // 发送成功之后的回调
        inputSend.value = '';
        data.msg = {};
        data.timestamp = new Date();
        data.msg.type = 'text';
        data.msg.text = val;
        data.fromPeerId = rt.cache.options.peerId;
        showMsg(data);
        printWall.scrollTop = printWall.scrollHeight;
    });

    // 发送多媒体消息，如果想测试图片发送，可以打开注释
    // room.send({
    //     text: '图片测试',
    //     // 自定义的属性
    //     attr: {
    //         a:123
    //     },
    //     url: 'https://leancloud.cn/images/static/press/Logo%20-%20Blue%20Padding.png',
    //     metaData: {
    //         name:'logo',
    //         format:'png',
    //         height: 123,
    //         width: 123,
    //         size: 888
    //     }
    // }, {
    //    type: 'image'
    // }, function(data) {
    //     console.log('图片数据发送成功！');
    // });
}

// 显示接收到的信息
function showMsg(data, isBefore) {
    var text = '';
    var from = cachedUsers[data.fromPeerId].get('username');
    if (data.msg.type === 'text') {
        text = data.msg.text;
    } else if (data.msg.type === 'image') {
        text = '<a target="_blank" href="' + data.msg.url + '"><img height="300" src="' + data.msg.url + '"></img></a>';
    } else {
        text = '<a target="_blank" href="' + data.msg.url + '">' + JSON.stringify(data.msg) + '</a>';
    }
    var timeAndFrom = '（' + formatTime(data.timestamp) + '）  ' + encodeHTML(from) + '： ';
    if (String(text).replace(/^\s+/, '').replace(/\s+$/, '')) {
        showLog(timeAndFrom, text, isBefore);
    }
}

// 拉取历史
bindEvent(printWall, 'scroll', function (e) {
    if (printWall.scrollTop < 10) {
        if (convLoadingFlag) {
            return;
        }
        getLog();
    }
});

// 获取消息历史
function getLog(callback) {
    var height = printWall.scrollHeight;
    if (logFlag) {
        return;
    } else {
        // 标记正在拉取
        logFlag = true;
    }
    room.log({
        t: msgTime,
        limit: 20
    }, function (data) {
        // 存储下最早一条的消息时间戳
        var l = data.length;
        console.log('l = ' + l);
        var clientIds = [];
        var i;
        for (i = 0; i < l; i++) {
            if (clientIds.indexOf(data[i].fromPeerId) === -1) {
                clientIds.push(data[i].fromPeerId);
            }
        }
        cacheUsersByIds(clientIds).then(function () {
            for (i = l - 1; i >= 0; i--) {
                showMsg(data[i], true);
            }
            if (l) {
                msgTime = data[0].timestamp;
                printWall.scrollTop = printWall.scrollHeight - height;
            }
            if (callback) {
                callback();
            }
            logFlag = false;
        }, function (error) {
            showLog(error.message);
            logFlag = false;
        });
    });
}

/*---------- ui ------------*/
function encodeHTML(source) {
    return String(source)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    // .replace(/\\/g,'&#92;')
    // .replace(/"/g,'&quot;')
    // .replace(/'/g,'&#39;');
}

function formatTime(time) {
    var date = new Date(time);
    var month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    var currentDate = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    var hh = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
    var mm = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
    var ss = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
    return month + '-' + currentDate + ' ' + hh + ':' + mm + ':' + ss;
}

function bindEvent(dom, eventName, fun) {
    if (window.addEventListener) {
        dom.addEventListener(eventName, fun);
    } else {
        dom.attachEvent('on' + eventName, fun);
    }
}

function handleError(error) {
    showLog(error.message);
}

// demo 中输出代码
function showLog(msg, data, isBefore) {
    if (data) {
        // console.log(msg, data);
        msg = msg + '<span class="strong">' + data + '</span>';
    }
    var p = document.createElement('p');
    p.innerHTML = msg;
    if (isBefore) {
        printWall.insertBefore(p, printWall.childNodes[0]);
    } else {
        printWall.appendChild(p);
    }
}

if (AV.User.current()) {
    $(loginItem).remove();
    $('#current-name-label').text(AV.User.current().get('username') + ' 已登录');
    loginSucceed(AV.User.current());
} else {
    $(logoutItem).remove();
    showLog('请登录');
}
