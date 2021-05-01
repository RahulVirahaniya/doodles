var socket=io.connect("http://localhost:3000");
socket.on('mouse', newDrawing);
socket.on('mouseup', newFinishedPosition);
socket.on('fill', newFillCanvas);
socket.on('clear', clearTheBoard);
const containerGamePlayers=document.getElementById('containerGamePlayers');
const canvas=document.getElementById('canvas');
const ctx=canvas.getContext('2d');
const form=document.getElementById('send-message');
const inputChat=document.getElementById('inputChat');
const boxMessage=document.querySelector('.boxMessage');
const colorPreview=document.querySelector('.colorPreview');
//const audio= new Audio("ting.mp3")
const append= (name, message, mode, type) =>{
  const messageElement = document.createElement('div');
  const span1=document.createElement('span');
  span1.innerText=name;
  messageElement.appendChild(span1);
  const span2=document.createElement('span');
  span2.innerText=message;
  messageElement.appendChild(span2);
  messageElement.classList.add('message');
  messageElement.classList.add(mode);
  span1.classList.add("boldName");
  if(type!==''){
    messageElement.classList.add(type);
  }
  boxMessage.append(messageElement);
  // if(mode==="left"){
  //   audio.play();
  // }
}
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const message=inputChat.value.substring(0,120);
  if(message.replace(/\s/g,'').length===0) {
    inputChat.value="";
    return;
  }
  const name="You: ";
  append(`${name}`, `${message}`, 'right', '');
  scrollToBottom();
  socket.emit('send', message);
  inputChat.value="";
});
let name;
do{
  name=prompt("Enter your name to join");
} while(!name || name.replace(/\s/g,'').length===0)
name=name.charAt(0).toUpperCase() + name.slice(1);
socket.emit('new-user-joined', name);
socket.on('user-joined', name =>{
  append(`${name}`, " joined the chat", 'left', 'join');
  scrollToBottom();
});
const appendPlayers = (rank, key, name, ID, score) => {
  const players=document.createElement('div');
  players.classList.add('player');
  containerGamePlayers.appendChild(players);
  const playerRank=document.createElement('div')
  playerRank.classList.add('rank');
  players.appendChild(playerRank);
  playerRank.innerText=rank;
  const info=document.createElement('div');
  info.classList.add('info');
  players.appendChild(info);
  const playername=document.createElement('div');
  playername.classList.add('name');
  if(key==ID){
    playername.classList.add('myName');
    playername.innerText=name+" (You)";
  }else {
    playername.innerText=name;
  }
  info.appendChild(playername);
  const playerScore=document.createElement('div');
  playerScore.classList.add('score');
  info.appendChild(playerScore);
  playerScore.innerText=score;
}
socket.on('update', function (data){
  $('#containerGamePlayers').empty();
  for (let [key, value] of Object.entries(data.users)) {
    appendPlayers("#1", `${key}`, `${value}`, `${data.id}`, "Points: 10");
  }
});
socket.on('recieve', data =>{
  append(`${data.name}: `, `${data.message}`, 'left', '');
  scrollToBottom();
});
socket.on('left', name =>{
  append(`${name}`, " left the chat", 'left', 'leave');
  scrollToBottom();
});
function scrollToBottom(){
  boxMessage.scrollTop=boxMessage.scrollHeight;
}
let painting=false;
$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});
let color=document.querySelector('.colorPreview').style.backgroundColor;
let size=6;
let pencil_mode=true, eraser_mode=false, fill_mode=false, flag=true;
if(flag){
  pencil();
  flag=false;
}
function myRange(){
  size=document.getElementById("myRange").value;
}
function colorPicker(){
  if(eraser_mode==false){
    color=document.getElementById("colorPicker").value;
  }
  document.querySelector('.colorPreview').style.backgroundColor=document.getElementById("colorPicker").value;
}
function change_color(element){
  if(eraser_mode===false){
    color=element.style.background;
  }
  document.querySelector('.colorPreview').style.backgroundColor=element.style.background;
}
function svgUrl(size) {
  const radius=size/2;
  return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${2*size}" height="${2*size}"><circle cx="${size}" cy="${size}" r="${radius}" stroke-width="1" stroke="black" fill="${color}"/></svg>')`;
}
$('.tool').click(function(){
  $('.tool').removeClass("toolActive");
  var data_tool=$(this).attr('data-tool');
  $('.tool[data-tool = '+data_tool+']').addClass("toolActive");
})
function pencil(){
  pencil_mode=true;
  eraser_mode=false;
  fill_mode=false;
  canvas.addEventListener('mouseover',(e)=>{
    $('canvas').css("cursor", `${svgUrl(size)} ${size} ${size}, auto`)
  });
  color=document.querySelector('.colorPreview').style.backgroundColor;
}
function eraser(){
  color="white";
  pencil_mode=false;
  eraser_mode=true;
  fill_mode=false;
  canvas.addEventListener('mouseover',(e)=>{
    $('canvas').css("cursor", `${svgUrl(size)} ${size} ${size}, auto`)
  });
}
function startPosition(e){
  painting=true;
  draw(e);
}
function finishedPosition(){
  painting=false;
  ctx.beginPath();
  socket.emit('mouseup');
}
function newFinishedPosition(data){
  ctx.beginPath();
}
function draw(e){
  if(!painting || fill_mode) return;
  ctx.lineWidth=size;
  ctx.lineCap="round";
  ctx.strokeStyle=color;
  ctx.lineTo(e.offsetX,e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  let data = {
    x: e.offsetX,
    y: e.offsetY,
    size: size,
    color: color
  }
  socket.emit('mouse', data);
  ctx.moveTo(e.offsetX,e.offsetY);
}
function newDrawing(data){
  ctx.lineWidth=data.size;
  ctx.lineCap="round";
  ctx.strokeStyle=data.color;
  ctx.lineTo(data.x,data.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(data.x,data.y);
}
function fill_canvas(){
  pencil_mode=false;
  eraser_mode=false;
  fill_mode=true;
  canvas.addEventListener('mouseover', () => {
    $('canvas').css("cursor","url(/images/fill_graphic.png) 7 38, default");
  });
  function getColorAtPixel(imageData, x, y) {
    const {width, data} = imageData
  
    return {
      r: data[4 * (width * y + x) + 0],
      g: data[4 * (width * y + x) + 1],
      b: data[4 * (width * y + x) + 2],
      a: data[4 * (width * y + x) + 3]
    }
  }
  
  function setColorAtPixel(imageData, color, x, y) {
    const {width, data} = imageData
  
    data[4 * (width * y + x) + 0] = color.r & 0xff
    data[4 * (width * y + x) + 1] = color.g & 0xff
    data[4 * (width * y + x) + 2] = color.b & 0xff
    data[4 * (width * y + x) + 3] = color.a & 0xff
  }
  
  function colorMatch(m, n) {
    return m.r == n.r && m.g == n.g && m.b == n.b && m.a == n.a;
  }
  function floodFill(imageData, newColor, x, y) {
    if(pencil_mode===true || eraser_mode===true) return
    const {width, height, data} = imageData
    const stack = []
    const baseColor = getColorAtPixel(imageData, x, y)
    let operator = {x, y}

    // Check if base color and new color are the same
    if (colorMatch(baseColor, newColor)) {
      return
    }
    // Add the clicked location to stack
    stack.push({x: operator.x, y: operator.y})

    while (stack.length) {
      operator = stack.pop()
      let contiguousDown = true // Vertical is assumed to be true
      let contiguousUp = true // Vertical is assumed to be true
      let contiguousLeft = false
      let contiguousRight = false

      // Move to top most contiguousDown pixel
      while (contiguousUp && operator.y >= 0) {
        operator.y--
        contiguousUp = colorMatch(getColorAtPixel(imageData, operator.x, operator.y), baseColor)
      }

      // Move downward
      while (contiguousDown && operator.y < height) {
        setColorAtPixel(imageData, newColor, operator.x, operator.y)

        // Check left
        if (operator.x - 1 >= 0 && colorMatch(getColorAtPixel(imageData, operator.x - 1, operator.y), baseColor)) {
          if (!contiguousLeft) {
            contiguousLeft = true
            stack.push({x: operator.x - 1, y: operator.y})
          }
        } else {
          contiguousLeft = false
        }

        // Check right
        if (operator.x + 1 < width && colorMatch(getColorAtPixel(imageData, operator.x + 1, operator.y), baseColor)) {
          if (!contiguousRight) {
            stack.push({x: operator.x + 1, y: operator.y})
            contiguousRight = true
          }
        } else {
          contiguousRight = false
        }

        operator.y++
        contiguousDown = colorMatch(getColorAtPixel(imageData, operator.x, operator.y), baseColor)
      }
    }
  }
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let col;
  canvas.addEventListener('click', event => {
    if(pencil_mode || eraser_mode) return;
    const rect = canvas.getBoundingClientRect()
    const x = Math.round(event.clientX - rect.left)
    const y = Math.round(event.clientY - rect.top)
    let rgb=document.querySelector('.colorPreview').style.backgroundColor
    rgb=rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
    col={r: rgb[0], g: rgb[1], b: rgb[2], a: 0xff};
    floodFill(imageData, col, x, y);
    ctx.putImageData(imageData, 0, 0);
    var img=canvas.toDataURL();
    socket.emit('fill', img);
  })
}
function newFillCanvas(img){
  var myImage = new Image();
  myImage.onload=function(){
    ctx.drawImage(myImage,0,0);
  };
  myImage.src = img;
}
function clear_canvas(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  socket.emit('clear');
}
function clearTheBoard(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
}
canvas.addEventListener("mousedown",startPosition);
canvas.addEventListener("mouseup",finishedPosition);
canvas.addEventListener("mousemove",draw);
canvas.addEventListener('mouseout',finishedPosition);
// for(var i=0;i<tool.length;i++){
//   tool[i].addEventListener('mouseover', ((j) =>{
//     return function(){
//       tool[j].style.backgroundColor="#9664c8";
//     }
//   })(i))
// }
// for(var i=0;i<tool.length;i++){
//   tool[i].addEventListener('mouseout', ((j) =>{
//     return function(){
//       tool[j].style.backgroundColor="#fff";
//     }
//   })(i))
// }
