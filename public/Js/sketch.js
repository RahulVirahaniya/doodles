var socket=io.connect("http://localhost:3000");
socket.on('mouse', newDrawing);
socket.on('mouseup', newFinishedPosition);
const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const form=document.getElementById('send-message');
const inputChat=document.getElementById('inputChat');
const boxMessage=document.querySelector('.boxMessage');
const append= (message, mode) =>{
  const messageElement = document.createElement('div');
  messageElement.innerText=message;
  messageElement.classList.add('message');
  messageElement.classList.add(mode);
  boxMessage.append(messageElement);
}
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const message=inputChat.value;
  append(`You: ${message}`, 'light');
  socket.emit('send', message);
  inputChat.value="";
});
let name=prompt("Enter your name to join");
while(name==="" || name=='undefined'){
  alert("Please enter your name to join the chat");
  name=prompt("Enter your name to join");
}
socket.emit('new-user-joined', name);
socket.on('user-joined', name =>{
  append(`${name} joined the chat`, 'dark');
});
socket.on('recieve', data =>{
  append(`${data.name}: ${data.message}`, 'dark');
});
socket.on('left', name =>{
  append(`${name} left the chat`, 'dark');
});
let painting=false;
function newFinishedPosition(data){
  ctx.beginPath();
}
function newDrawing(data){
  ctx.lineWidth=10;
  ctx.lineCap="round";
  ctx.strokeStyle='blue';
  ctx.lineTo(data.x,data.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(data.x,data.y);
}
function startPosition(e){
  painting=true;
  draw(e);
}
function finishedPosition(){
  painting=false;
  ctx.beginPath();
  socket.emit('mouseup', false);
}
function draw(e){
  if(!painting) return;
  ctx.lineWidth=10;
  ctx.lineCap="round";
  ctx.strokeStyle='red';
  ctx.lineTo(e.offsetX,e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  let data = {
    x: e.offsetX,
    y: e.offsetY
  }
  socket.emit('mouse', data);
  ctx.moveTo(e.offsetX,e.offsetY);
}
canvas.addEventListener("mousedown",startPosition);
canvas.addEventListener("mouseup",finishedPosition);
canvas.addEventListener("mousemove",draw);
