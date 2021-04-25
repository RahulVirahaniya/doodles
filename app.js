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
    users[socket.id]=name;
    socket.broadcast.emit('user-joined', name);
  });
  socket.on('send', message =>{
    socket.broadcast.emit('recieve', {name: users[socket.id], message: message});
  });
  socket.on('disconnect', message =>{
    socket.broadcast.emit('left', users[socket.id]);
    delete users[socket.id];
  });
  socket.on('mouse', mouseMessage);
  function mouseMessage(data){
    socket.broadcast.emit('mouse',data);
  }
  socket.on('mouseup', mouseUpMessage);
  function mouseUpMessage(data) {
    socket.broadcast.emit('mouseup', data);
  }
});
const PORT = 3000 || process.env.PORT;
server.listen(PORT, () =>{console.log("Port 3000 is running");});
