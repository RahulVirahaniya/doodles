const express=require('express');
const bodyParser = require('body-parser');
const app=express();
const server=require('http').createServer(app);
const io=require('socket.io')(server, {cors: {origin: "*"}});
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');
app.get('/', (req, res) =>{
  res.render("home");
});
let EnteredName="";
app.post('/',(req,res) =>{
  EnteredName=req.body.enteredName;
  EnteredName=EnteredName.charAt(0).toUpperCase() + EnteredName.slice(1);
  res.render("sketch");
});
const users={};

const userScore = {};

const guessOnlyOnce = {};

const words=["car" , "bike" , "building" , "laptop" , "phone" , "well" , "pond" , "medicine" , "water" , "bottle"];
function randomNumbers(){

  let x = Math.floor((Math.random() * 7) + 1);
  let y = x+1;
  let z = y+1;
  return [x,y,z];
}

let correctAnswer;

const totalUsers = 2;

let curActiveUser;

io.on('connection', socket =>{
  users[socket.id]=EnteredName;
  userScore[socket.id]=0;
  guessOnlyOnce[socket.id]=true;
  socket.broadcast.emit('user-joined', EnteredName);

  socket.emit('userId', socket.id);
  updateClients();

  if(Object.keys(users).length == totalUsers)
  {
    //looping through the users

    let count = 0;
    for(let k=0;k<2;k++)
    {
      for(let i=0;i<Object.keys(users).length;i++)
      {
        setTimeout(function() {
          let arr = randomNumbers();

          correctAnswer="";
          let curUserID = Object.keys(users)[i];
          curActiveUser=curUserID;
          console.log(curUserID);

          console.log(count);
          let assignedWords = [words[arr[0]],words[arr[1]],words[arr[2]]]
          io.emit('restrictAccess', { id : curUserID});
          io.emit('passRandomWords' , assignedWords);

            for(let j=0;j<Object.keys(users).length;j++) {
                guessOnlyOnce[Object.keys(users)[j]]=true;
            }

        }, 20000*(count) );
          count++;
      }
    }


  }
  else
  {
    console.log("waiting for users to join");
  }

  socket.on('send', data =>{

    // checking answers
    if(data.message === correctAnswer && correctAnswer!="" && curActiveUser!=data.id && guessOnlyOnce[data.id])
    {
        userScore[data.id]+= 10;
        socket.emit('youGuessedRight', {id :data.id , name: "You", message: "guessed the right answer!"});
        socket.broadcast.emit('someoneGuessedAns', {id :data.id , name: users[data.id], message: " guessed the right answer!"});
        updateClients(data.id);
        guessOnlyOnce[data.id]=false;
    }

      socket.broadcast.emit('recieve', {id :data.id , name: users[data.id], message: data.message});

  });

  socket.on('disconnect', message =>{
    const ID=socket.id;
    socket.broadcast.emit('left', { id :socket.id , name : users[socket.id]});
    delete users[socket.id];
    delete userScore[socket.id];
    updateClients(ID);
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
    correctAnswer = data;
    socket.broadcast.emit('guessWord', data);
  });

  function updateClients(ID) {

    // object conversion to array AND score wise sorting

    let userScoreArr = [];
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
        userScoreArr[0][2] = rank;
      } else {
        if(userScoreArr[i][1]==userScoreArr[i-1][1]) {
          userScoreArr[i][2] = rank;
        } else {
          rank++;
          userScoreArr[i][2] = rank;
        }
      }
    }

    const data={
      id: ID,
      users: users,
      score: userScore,
      userScoreArr: userScoreArr,
    }

    io.sockets.emit('update', data);
  }

});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () =>{console.log("Port 3000 is running");});
