const express=require('express');
const app=express();
const server=require('http').createServer(app);
const io=require('socket.io')(server, {cors: {origin: "*"}});
app.use(express.static("public"));
app.set('view engine','ejs');
app.get('/',(req,res) =>{
  res.render("canvas");
});
const users={};

const userScore = {};

const words=["car" , "bike" , "building" , "laptop" , "phone" , "well" , "pond" , "medicine" , "water" , "bottle"];

function randomNumbers(){

  let x = Math.floor((Math.random() * 7) + 1);
  let y = x+1;
  let z = y+1;
  return [x,y,z];
}

let correctAnswer;

const totalUsers = 2;

io.on('connection', socket =>{
  socket.on('new-user-joined', name =>{
    const ID=socket.id;
    users[socket.id]=name;
    socket.broadcast.emit('user-joined', name);
    updateClients(ID);

    socket.emit('userId', socket.id);

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
            let curUserID = Object.keys(users)[i];
            console.log(curUserID);

            console.log(count);
            let assignedWords = [words[arr[0]],words[arr[1]],words[arr[2]]]
            io.emit('restrictAccess', { id : curUserID})
            io.emit('passRandomWords' , assignedWords);
          
          }, 10000*(count) );
            count++;
        }
      }


    }
    else
    {
      console.log("waiting for users to join");
    }
  });

  socket.on('send', message =>{
    if(message === correctAnswer)
    {
      userScore[socket.id] += 10;
     socket.emit('youGuessedRight', {id :socket.id , name: "You", message: "guessed the right"});
    }

      socket.broadcast.emit('recieve', {id :socket.id , name: users[socket.id], message: message});

  });

  socket.on('disconnect', message =>{
    const ID=socket.id;
    socket.broadcast.emit('left', { id :socket.id , name : users[socket.id]});
    delete socket.id;
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
    const data={
      id: ID,
      users: users
    }
    io.sockets.emit('update', data);
  }

});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () =>{console.log("Port 3000 is running");});
