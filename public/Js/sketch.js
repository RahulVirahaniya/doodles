var socket=io.connect("https://dooodles.herokuapp.com/");
socket.on('mouse', newDrawing);
socket.on('mouseup', newFinishedPosition);
socket.on('fill', newFillCanvas);
socket.on('clear', clearTheBoard);
const containerGamePlayers=document.getElementById('containerGamePlayers');
const playersResult=document.getElementById('playersResult');
const wordsContainer=document.getElementById('wordsContainer');
const wordSelectAndHint = document.getElementById('wordSelectAndHint');
const canvas=document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const form=document.getElementById('send-message');
const inputChat=document.getElementById('inputChat');
const boxMessage=document.querySelector('.boxMessage');
const colorPreview=document.querySelector('.colorPreview');
const word1 = document.getElementById('word1');
const word2 = document.getElementById('word2');
const word3 = document.getElementById('word3');
const popUp = document.getElementById("pvtRoomPopUp");
const timer = document.getElementById('timer');
const wordBox = document.getElementById('wordBox');
//const audio= new Audio("ting.mp3")

// add other's message to the message box
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

// bringing in id

let curUserId = 0;
socket.on('userId', data =>{
  curUserId = data;
});

// add your message to the message box

form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const message=inputChat.value.substring(0,120);
  if(message.replace(/\s/g,'').length===0) {
    inputChat.value="";
    return;
  }
  const name="You: ";
  // append(`${name}`, `${message}`, 'right', '');
  scrollToBottom();
  socket.emit('send', {id: curUserId, message:message});
  inputChat.value="";
});
let name;
socket.on('user-joined', name =>{
  name=name.charAt(0).toUpperCase() + name.slice(1);
  append(`${name}`, " joined the chat", 'left', 'green');
  scrollToBottom();
  let img=canvas.toDataURL();
  socket.emit('fill', img);
});

// adding players to the score list
const appendPlayers = (rank, key, name, score, curActiveUser, flag) => {
  const players=document.createElement('div');
  players.classList.add('player');
  containerGamePlayers.appendChild(players);
  players.setAttribute("id" , key);
  if(!flag)
    players.style.backgroundColor="#82c669";
  const playerRank=document.createElement('div')
  playerRank.classList.add('rank');
  players.appendChild(playerRank);
  playerRank.innerText="#"+rank;
  const info=document.createElement('div');
  info.classList.add('info');
  players.appendChild(info);
  const playername=document.createElement('div');
  playername.classList.add('name');
  if(key===curUserId){
    playername.classList.add('myName');
    playername.innerText=name+" (You)";
  }else {
    playername.innerText=name;
  }
  info.appendChild(playername);
  const playerScore=document.createElement('div');
  playerScore.classList.add('score');
  info.appendChild(playerScore);
  playerScore.innerText="Points: "+score;
  const pencil = document.createElement('div');
  pencil.classList.add('pencil');
  players.appendChild(pencil);
  if(key == curActiveUser)
    pencil.innerHTML='<img class="toolIcon" src="images/pen.gif">';
}

// appending players to the players list

socket.on('update', function (data){
  $('#containerGamePlayers').empty();
    for (let [key, value, rank] of data.userScoreArr) {
      appendPlayers(rank, key, data.users[key], value, data.curActiveUser, data.guessOnlyOnce[key]);
  }
});


// others message to the left
///////////////////////////////////////////////////////////////////////////////////////////////////////
socket.on('receive', data =>{
  if(data.id === curUserId) {
    append('You: ', data.message, 'right', '');
  } else {
    append(`${data.name}: `, data.message, 'left', '');
  }
  scrollToBottom();
});

// Right answer guessed
socket.on("answerGuessed", data => {
  if(curUserId === data.id){
    append("You", " guessed the right answer!", 'right', 'green');
  } else {
    append(`${data.name}`, " guessed the right answer!", 'left', 'green');
  }
  scrollToBottom();
});

// close to the right answer

socket.on("closeToAnswer", data =>{
  if(data.id !== accessId) {
    append(`'${data.message}'`, " is close!", 'right', 'yellow');
  }
  scrollToBottom();
});

// when a player leaves

socket.on('left', data=>{
  append(`${data.name}`, " left the chat", 'left', 'red');
  scrollToBottom();
});

// when disconnected from server side

socket.on('disconnect', () =>{
  window.location.href=window.location.href;
});

// chat scrolls to bottom

function scrollToBottom(){
  boxMessage.scrollTop=boxMessage.scrollHeight;
}

let painting=false;
let color=colorPreview.style.backgroundColor;
let size=6;
let pencil_mode=true, eraser_mode=false, fill_mode=false, flag=true;
let accessId = '';

socket.on('restrictAccess', data =>{
  const hint = document.getElementById("hint");
  clear_canvas();
  accessId = data.id;
  const toolbar = document.getElementById('toolbar');
  timer.classList.remove('toHide');
  hint.innerHTML="";
  hint.classList.add('toHide');
  // giving access to the user
  if(curUserId === accessId)
  {
    toolbar.classList.remove('toHide');
    socket.emit('removeToolbar' , data.id);
    append("You", " are Drawing Now!", 'right', 'blue');
    $("#votekickCurrentplayer").prop('disabled', true);
    $(".tooltip-wrapper").addClass("disabled");
    scrollToBottom();
  } else {
    append(data.activeUsername, " is Drawing Now!", 'left', 'blue');
    $("#votekickCurrentplayer").prop('disabled', false);
    $(".tooltip-wrapper").removeClass("disabled");
    scrollToBottom();
  }
  wordSelectAndHint.style.display='block';
});

// click to voteKick the current player

$("#votekickCurrentplayer").on('click', () =>{
  socket.emit('voteKick', '');
  $("#votekickCurrentplayer").prop('disabled', true);
  $(".tooltip-wrapper").addClass("disabled");
});

// Remove the current player by voteKick

socket.on('voteKickMessage', data =>{
  if(curUserId !== data.id) {
    append(`'${data.voteKicker}'`, ` is voting to kick '${data.currDrawer}' (${data.voteKickCount}/${data.userLength})`, 'left', 'yellow');
  } else {
    append('You', ` have voted to kick '${data.currDrawer}' (${data.voteKickCount}/${data.userLength})`, 'right', 'yellow')
  }
});

socket.on('voteKickCurrentPlayer', data => {
  window.location.href = window.location.href;
});

//  hiding toolbar for other users

socket.on('hideToolbar', id =>{
    const toolbar = document.getElementById('toolbar');
    toolbar.classList.add('toHide');
})

// receiving timer data

socket.on('timer', data=> {

  if($('#timer').hasClass('toHide')){
    timer.classList.remove('toHide');
  }
  if(curUserId==accessId){
    timer.innerHTML = data.timerData;
  } else {
    timer.innerHTML = data.timerOthers;
  }
});

// getting automatically selected random word from backend

socket.on('autoChosenWord', data=> {
  getSelectedWord(data);
});

// shows correct answer after time out

socket.on('correctAnswer', data =>{
  if(curUserId != accessId){
    append("The word was ",`'${data}'`, 'left', 'green');
  }
});

// Round of the game

socket.on('round', data => {
  document.getElementById("round").innerText=`Round ${data} out of 3`;
});

// showing words on screen

socket.on('passRandomWords' , data =>{

  if(curUserId === accessId)
  {
    const wordBoxHeading= document.getElementById('wordBoxHeading');
    wordBoxHeading.classList.remove('toHide');

    // console.log(data);
    socket.emit('removeWordBox');
    const word1 = document.getElementById('word1');
    word1.classList.remove('selectedWord');
    word1.innerHTML = data[0];
    word1.setAttribute('onclick','getSelectedWord(this.innerHTML)')


    const word2 = document.getElementById('word2');
    word2.classList.remove('toHide');
    word2.innerHTML = data[1];
    word2.setAttribute('onclick','getSelectedWord(this.innerHTML)')


    const word3 = document.getElementById('word3');
    word3.classList.remove('toHide');
    word3.innerHTML = data[2];
    word3.setAttribute('onclick','getSelectedWord(this.innerHTML)')

    wordBox.classList.remove('toHide');
    wordBox.style.display='flex';
  }

})

socket.on('hideWordBox', id =>{
  wordBox.classList.add('toHide');
  wordBox.style.display='none';
});


function getSelectedWord(data)
{
  const wordBoxHeading= document.getElementById('wordBoxHeading');
  wordBoxHeading.classList.add('toHide');
  const word1 = document.getElementById('word1');
  const word2 = document.getElementById('word2');
  const word3 = document.getElementById('word3');

  word2.classList.add('toHide');
  word3.classList.add('toHide');
  word1.classList.add('selectedWord');
  word1.innerHTML = data;
  socket.emit('curChosenWord' , data);
}

// Guess Word Hint

socket.on('ansHint', data=>{
  const hint = document.getElementById("hint");
  if(curUserId !== accessId) {
    hint.classList.remove('toHide');
    hint.innerHTML=data.hint;
  }
});

// append final result of the players

const appendResult = (rank, key, name, score) => {
  const finalPlayer=document.createElement('div');
  finalPlayer.classList.add('finalPlayer');
  const finalPlayerRank=document.createElement('div')
  finalPlayerRank.classList.add('finalPlayerRank');
  finalPlayer.appendChild(finalPlayerRank);
  finalPlayerRank.innerText="# "+rank;
  const finalPlayerName=document.createElement('div');
  finalPlayerName.classList.add('finalPlayerName');
  if(key == curUserId){
    finalPlayerName.classList.add('myName');
    finalPlayerName.innerText=name+" (You)";
  }else {
    finalPlayerName.innerText=name;
  }
  finalPlayer.appendChild(finalPlayerName);
  const finalPlayerScore=document.createElement('div');
  finalPlayerScore.classList.add('finalPlayerScore');
  finalPlayer.appendChild(finalPlayerScore);
  finalPlayerScore.innerText=score;
  playersResult.appendChild(finalPlayer);
}
socket.on('gameFinished', (data) =>{
  // show popup
  for (let [key, value, rank] of data.userScoreArr) {
    appendResult(rank, key, data.users[key], value);
  }
  popUp.classList.remove('toHide');
  popUp.style.display = "flex";
  setTimeout(() => {
    socket.disconnect();
    window.location.href = window.location.href;
  }, 5000);
});

///////////////////////////////////////////////////////////////////////////////////////////////


$(document).ready(function(){
  $('[data-toggle="tooltip"]').tooltip();
});
//  canvas code

  if(flag){
    pencil();
    flag=false;
  }
  function myRange(){
    size=document.getElementById("myRange").value;
    if(pencil_mode){
      pencil();
    }
  }
  function colorPicker(){
    colorPreview.style.backgroundColor=document.getElementById("colorPicker").value;
    if(eraser_mode==false){
      color=document.getElementById("colorPicker").value;
      if(fill_mode===false){
        pencil();
      }
    }
  }
  function change_color(element){
    if(eraser_mode===false){
      color=element.style.background;
    }
    colorPreview.style.backgroundColor=element.style.background;
  }
  function svgUrl(size) {
    const radius=size/2;
    return `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${2*size}" height="${2*size}"><circle cx="${size}" cy="${size}" r="${radius}" stroke-width="1" stroke="black" fill="${color}"/></svg>')`;
  }
  $('.tool').click(function(){
    $('.tool').removeClass("toolActive");
    var data_tool=$(this).attr('data-tool');
    $('.tool[data-tool = '+data_tool+']').addClass("toolActive");
  });
  function pencil(){
    pencil_mode=true;
    eraser_mode=false;
    fill_mode=false;
    canvas.addEventListener('mouseover',(e)=>{
      $('canvas').css("cursor", `${svgUrl(size)} ${size} ${size}, auto`)
    });
    color=colorPreview.style.backgroundColor;
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

  ////////////// editing here

  function draw(e){
    if(curUserId != accessId || !painting || fill_mode) return;
    ctx.lineWidth=size;
    ctx.lineJoin=ctx.lineCap="round";
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


  ////////////////////////////////


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

  function fill_canvas(){
    pencil_mode=false;
    eraser_mode=false;
    fill_mode=true;
    canvas.addEventListener('mouseover', () => {
      $('canvas').css("cursor","url(/images/fill_graphic.png) 7 38, default");
    });

    function floodFill(imageData, newColor, x, y) {
      if(pencil_mode === true || eraser_mode === true) return
      const {width, height, data} = imageData
      const stack = []
      const baseColor = getColorAtPixel(imageData, x, y);
      let operator = {x, y}

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

    canvas.addEventListener('click', event => {
      if(curUserId !== accessId) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let newColor;
      const rect = canvas.getBoundingClientRect()
      const x = Math.round(event.clientX - rect.left)
      const y = Math.round(event.clientY - rect.top)
      
      const baseColor = getColorAtPixel(imageData, x, y);
      let rgb=colorPreview.style.backgroundColor
      rgb=rgb.substring(4, rgb.length-1).replace(/ /g, '').split(',');
      newColor={r: rgb[0], g: rgb[1], b: rgb[2], a: 0xff};
      // Check if base color and new color are the same
      if (colorMatch(baseColor, newColor)) {
        console.log("match");
        return;
      }
      floodFill(imageData, newColor, x, y);
      ctx.putImageData(imageData, 0, 0);
      let img=canvas.toDataURL();
      socket.emit('fill', img);
    });
  }
  function newFillCanvas(img){
    var myImage = new Image();
    myImage.onload=function(){
      ctx.drawImage(myImage,0,0);
    };
    myImage.src = img;
  }
  function clear_canvas(){
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear');
  }
  function clearTheBoard(){
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  canvas.addEventListener("touchstart",startPosition);
  canvas.addEventListener("mousedown",startPosition);

  canvas.addEventListener("touchend",finishedPosition);
  canvas.addEventListener("mouseup",finishedPosition);
  canvas.addEventListener('mouseout',finishedPosition);

  canvas.addEventListener("touchmove",draw);
  canvas.addEventListener("mousemove",draw);

  // disconnect on refresh of user

  if (sessionStorage.getItem("is_reloaded")) {
    sessionStorage.removeItem("is_reloaded");
    socket.disconnect();
    window.location.href = window.location.href;
  } else {
    sessionStorage.setItem("is_reloaded", true);
  }