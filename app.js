const express=require('express');
const bodyParser = require('body-parser');
const app=express();
const server=require('http').createServer(app);
const io=require('socket.io')(server, {cors: {origin: "*"}});
const words = require("./gameWords");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');

app.get('/', (req, res) =>{
  res.render("home");
});

let EnteredName="";
const users={};

app.post('/',(req,res) =>{
  if(Object.keys(users).length>7) res.redirect('/');
  EnteredName=req.body.enteredName;
  EnteredName=EnteredName.charAt(0).toUpperCase() + EnteredName.slice(1);
  res.render("sketch");
});

const userScore = {};
const guessOnlyOnce = {};
let userScoreArr = [];
let correctAnswer;
const totalUsers = 2;
let curActiveUser = '';
let wordSelectedTillNow = true;
let nextUser=0;
let timePassed=0;
let onlyOneUser=0;
let x, round=1, hint1=-1, hint2=-1, hint3=-1;
let voteKickCount=0;
function randomNumbers(){

  let x = Math.floor((Math.random() * words.length) );
  let y = Math.floor((Math.random() * words.length) );
  while(x == y)
  {
    y = Math.floor((Math.random() * words.length) );
  }
  let z = Math.floor((Math.random() * words.length) );
  while(z==y || z==x)
  {
    z = Math.floor((Math.random() * words.length));
  }
  return [x,y,z];
}


io.on('connection', socket =>{
  users[socket.id]=EnteredName;
  userScore[socket.id]=0;
  guessOnlyOnce[socket.id]=true;
  socket.broadcast.emit('user-joined', EnteredName);

  socket.emit('userId', socket.id);
  updateClients();

  if(Object.keys(users).length === totalUsers)
  {
    //looping through the users

    let windowTime = setInterval(function() {
      if(Object.keys(users).length == 0){
        clearInterval(windowTime);
        clearInterval(x);
        round=1;
        hint1=hint2=hint3=-1;
        return;
      }
      if(Object.keys(users).length == 1) {
        onlyOneUser++;
        if(onlyOneUser == 5) {
          round=1;
          io.emit('gameFinished', {userScoreArr: userScoreArr, users: users } );
          clearInterval(windowTime);
          clearInterval(x);
        }
      } else {
        onlyOneUser=0;
      }

      if(timePassed%92 == 0) {

        wordSelectedTillNow = false;
        let arr = randomNumbers();

        correctAnswer="";
        let userLength=Object.keys(users).length;
        if(nextUser !== 0 && nextUser%userLength == 0) {
          nextUser=0;
          round++;
          if(round === 4) {
            clearInterval(windowTime);
            io.emit('gameFinished', {userScoreArr: userScoreArr, users: users } );
            delete users;
            delete userScore;
            round=1;
            return;
          }
        }

        let seconds = 90;
        let timerData="";
        let ansHint="";
        let timerOthers="";
        voteKickCount=0;    
        let curUserID = Object.keys(users)[nextUser];

          nextUser++;
          curActiveUser=curUserID;
          hint1=hint2=hint3=-1;
          let assignedWords = [words[arr[0]],words[arr[1]],words[arr[2]]];

          clearInterval(x);

           x = setInterval(function() {
              if (seconds < 1) {
                clearInterval(x);
                timerOthers="Time Over!";
                timerData="Time Over!";
                hint1 = -1;
                hint2 = -1;
              } else if(seconds>80 && !wordSelectedTillNow) {
                timerOthers=users[curActiveUser]+" is choosing a word!";
                timerData="Choose A Word in "+(seconds-80)+" sec";
              } else if(seconds%10 == 0) {

                // automatically choosing a word for drawing
                if(correctAnswer=="") {
                  correctAnswer= assignedWords[Math.floor(Math.random() * 3)];
                  io.to(curActiveUser).emit('autoChosenWord', correctAnswer);
                  wordSelectedTillNow=false;
                }

                //hint
                if(seconds == 60) {
                  hint1 = Math.floor((Math.random() * correctAnswer.length) );
                } else if(seconds == 20) {
                  hint2 = Math.floor((Math.random() * correctAnswer.length) );
                  while(hint1 == hint2) {
                    hint2 = Math.floor((Math.random() * correctAnswer.length) );
                  }
                } else if(seconds == 40 && correctAnswer.length>5){
                  hint3 = Math.floor((Math.random() * correctAnswer.length) );
                  while(hint3 == hint2 || hint3 == hint1) {
                    hint3 = Math.floor((Math.random() * correctAnswer.length) );
                  }
                }
                ansHint="";
                for(let count=0; count<correctAnswer.length; count++) {
                  if(hint1 !== -1 && count == hint1){
                    ansHint+=correctAnswer[hint1]+" ";
                  } else if(hint2 !== -1 && count == hint2) {
                    ansHint+=correctAnswer[hint2]+" ";
                  } else if(hint3 !==-1 && count == hint3) {
                    ansHint+=correctAnswer[hint3]+" "; 
                  } else {
                    ansHint+="_ ";
                  }
                }
              
                io.emit('ansHint', {hint: ansHint});
              } 
              if(seconds<=80 || wordSelectedTillNow) {
                timerOthers=users[curActiveUser]+" time Over in "+seconds+ " sec";
                timerData="Your time Over in "+seconds+" sec";
                ansHint="";
                for(let count=0; count<correctAnswer.length; count++){
                  ansHint+="_ ";
                }
                if(seconds>80)
                  io.emit('ansHint', {hint: ansHint});
              }
              io.emit('timer', {timerData: timerData, timerOthers: timerOthers});
              if(seconds < 1){
                io.emit('correctAnswer', correctAnswer);
                correctAnswer="";
              }
              seconds--;

            }, 1000);
          setTimeout(() =>{
            updateClients(socket.id);
            io.emit('restrictAccess', { id : curUserID, activeUsername: users[curUserID]});
            io.emit('passRandomWords' , assignedWords);
          }, 1000);
            for(let j=0;j<Object.keys(users).length;j++) {
              guessOnlyOnce[Object.keys(users)[j]]=true;
            }
        }

        timePassed++;
        io.emit('round', round);
        timePassed = timePassed%92;
      }, 1000);

  } else {
    console.log("waiting for users to join");
  }

  socket.on('send', data =>{

    let newMessage = data.message.toLowerCase().replace(" ","");
    let newCorrectAnswer = correctAnswer.toLowerCase().replace(" ","");

    // longest common subsequence of guessed answer and correct answer

    let n = newMessage.length;
    let m = newCorrectAnswer.length;
    let dp = new Array(n+1);
    for(let i=0; i<=n; i++){
      dp[i] = new Array(m+1);
    }
    for(let i=0; i<=n; i++){
      for(let j=0; j<=m; j++){
        if(i ===0 || j === 0)
          dp[i][j]=0;
        else if(newMessage[i-1] === newCorrectAnswer[j-1])
          dp[i][j] = 1+dp[i-1][j-1];
        else 
          dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
      }
    }
    
    // checking answers
    if(newMessage === newCorrectAnswer && newCorrectAnswer != "")
    {
      if(curActiveUser != data.id && guessOnlyOnce[data.id]) {
        userScore[data.id]+=(450-5*timePassed);
        io.emit('answerGuessed', {id: data.id, name: users[data.id]});
        guessOnlyOnce[data.id]=false;
        updateClients(data.id);
      }
    } else if(Math.abs(n-dp[n][m]) <= 1 && Math.abs(m-dp[n][m]) <= 1) {
      if(guessOnlyOnce[data.id]){
        socket.emit('closeToAnswer', {id: data.id, message: data.message});
      }
    } else {
      io.emit('receive', {id :data.id, name: users[data.id], message: data.message});
    }
  });

  socket.on('disconnect', message =>{
    if(Object.keys(users).indexOf(socket.id) < nextUser) {
      nextUser--;
    }
    if(socket.id == curActiveUser) {
      clearInterval(x);
      timePassed=92;
    }
    socket.broadcast.emit('left', { id :socket.id , name : users[socket.id]});
    delete users[socket.id];
    delete userScore[socket.id];
    delete guessOnlyOnce[socket.id];
    updateClients(socket.id);
  });

  // votekick
  socket.on('voteKick', message => {
    let userLength=Object.keys(users).length;
    if(userLength === 1) return;
    voteKickCount++;
    userLength=Math.ceil(userLength/2);
    const data={
      id: socket.id,
      voteKicker: users[socket.id],
      currDrawer: users[curActiveUser],
      voteKickCount: voteKickCount,
      userLength: userLength,
    }
    io.emit('voteKickMessage', data);
    if(voteKickCount === userLength){
      io.to(curActiveUser).emit('voteKickCurrentPlayer', '');
    }
  });

  socket.on('mouse', (data)=>{
    socket.broadcast.emit('mouse', data);
  });

  socket.on('mouseup',()=>{
    socket.broadcast.emit('mouseup');
  });

  socket.on('fill', (img)=>{
    socket.broadcast.emit('fill', img);
  });

  socket.on('clear', ()=>{
    socket.broadcast.emit('clear');
  });

  socket.on('removeToolbar', (id)=>{
    socket.broadcast.emit('hideToolbar' , id);
  });

  socket.on('removeWordBox', ()=>{
    socket.broadcast.emit('hideWordBox');
  });

  socket.on('curChosenWord', (data)=>{
    wordSelectedTillNow=true;
    correctAnswer = data;
  });

  function updateClients(ID) {

    // object conversion to array AND score wise sorting
    while(userScoreArr.length>0)
      userScoreArr.pop();
    for (let id in userScore) {
        // userScoreArr[...][0] => id , userScoreArr[...][1] => score, userScoreArr[...][2] => rank
        userScoreArr.push([id, userScore[id], 0]);
    }

    userScoreArr.sort(function(a, b) {
        if(b[1]==a[1]) {
          return -1;
        }
        return b[1] - a[1];
    });

    // rank calculation
    let rank=1;
    for(let i=0;i<userScoreArr.length; i++) {
      if(i==0) {
        userScoreArr[i][2] = rank;
        // userRank[userScoreArr[i][0]] = rank;
      } else {
        if(userScoreArr[i][1]==userScoreArr[i-1][1]) {
          userScoreArr[i][2] = rank;
        } else {
          rank++;
          userScoreArr[i][2] = rank;
          // userRank[userScoreArr[i][0]] = rank;
        }
      }
    }

    if(userScoreArr.length > 0)
    curWinner = userScoreArr[0][0];

    const data={
      users: users,
      userScoreArr: userScoreArr,
      guessOnlyOnce: guessOnlyOnce,
      curActiveUser: curActiveUser
    }

    io.sockets.emit('update', data);
  }

});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () =>{console.log(`Port ${PORT} is running`);});
