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
io.on('connection', socket =>{
  socket.on('new-user-joined', name =>{
    const ID=socket.id;
    users[socket.id]=name;
    socket.broadcast.emit('user-joined', name);
    updateClients(ID);
  });
  socket.on('send', message =>{
    socket.broadcast.emit('recieve', {name: users[socket.id], message: message});
  });
  socket.on('disconnect', message =>{
    const ID=socket.id;
    socket.broadcast.emit('left', users[socket.id]);
    delete users[socket.id];
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
