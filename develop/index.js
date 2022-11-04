const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});


let list = {};

// io => 클라이언트와의 모든 연결
// socket => 클라이언트 한 명
io.on('connection', function(socket){
    console.log('Connected : ', socket.id);


    // ○○○ 님이 입장하셨습니다.
    socket.on('info2', function(data){
        list[socket.id] = data.nickname;

        // prompt 에서 입력한 아이디 === list[socket.id] === data.nickname
        console.log('입력한 아이디 : ', list[socket.id]);

        //서버에 접속되어 있는 모든 클라이언트에게 메시지 전송
        io.emit('welcome', data.nickname + '님이 입장하셨습니다.');

        // 서버에 접속되어 있는 모든 클라이언트에게 Select 목록 전송
        io.emit('list', list);

        io.emit('userList', list[socket.id]);
    });



    socket.on('send', function(data){
        // data : {msg : msg, to : nick};
        console.log('입력한 메시지 : ', data.msg);

        data['is_dm'] = false;

        data['nickname'] = list[socket.id];

        // data.to : {to : nick(document.getElementById('nick-list').value)}
        if(data.to == '전체'){
            // 글 작성 후 전송 버튼 누르면 작성 된다.
            io.emit('newMessage', data);
        } else{
            data['is_dm'] = true;

            // Object.keys() - 키 배열 반환
            let socketID = Object.keys(list).find((key) => {return list[key] === data.to});
            console.log(socketID);
            console.log(data);

            // io.to는 특정한 사람에게만 보내는 방법
            io.to(socketID).emit('newMessage', data);

            // 특정한 사람에게 보낸 메시지가 나에게 보이게 하는 방법
            socket.emit('newMessage', data);
        }
    });


    socket.on('disconnect', function(){
        io.emit('welcome', list[socket.id] + '님이 퇴장하셨습니다.');

        // 나간 사람을 서버에서 삭제하는 방법
        delete list[socket.id];
        io.emit('list', list);
    })
})





http.listen(8080, function(){
    console.log('Server Port : ', 8080);
});