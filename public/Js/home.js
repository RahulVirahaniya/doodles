// const enteredName = document.getElementById('enteredName');
// const timeLimit = document.getElementById('timeLimit');
// const selectRound = document.getElementById('selectRound');
// const customWords = document.getElementById('customWords');
// const customCheck = document.getElementById('customCheck');
// const pvtRoomUrl = document.getElementsByClassName('room-url')[0];
// const roomErr = document.getElementById('roomErr');

// let popUp = document.getElementById("pvtRoomPopUp");

// function clearRoomForm() {
//     enteredName.value = '';
//     timeLimit.value = '30';
//     selectRound.value = '1';
//     customWords.value = '';
//     customWords.disabled =  true;
//     customCheck.checked = false;
//     pvtRoomUrl.innerText = 'Hover here for the URL and Invite Your Friends.';
//     roomErr.style.display = "none";
// }

// document.getElementById("enterPvtRoom").addEventListener('click' ,function() {
//   popUp.style.display = "flex";
// });

// document.getElementById("close").addEventListener('click', function() {
//   clearRoomForm();
//   popUp.style.display = "none";
// });

// window.addEventListener('click', function(event) {
//   if (event.target == popUp) {
//     popUp.style.display = "none";
//     clearRoomForm();
//   }
// });

window.addEventListener( "pageshow", function ( event ) {
    event.preventDefault();
    var historyTraversal = event.persisted || ( typeof window.performance != "undefined" && window.performance.navigation.type === 2 );
    if ( historyTraversal ) {
    window.location.reload();
    }
});

document.getElementById('playBtn').addEventListener('click', function () {
  if(document.getElementById('enteredNameId').value.replace(/\s/g, '').length===0) {
    document.getElementById('emptyNameMsg').style.display = "block";
    } else {
    document.getElementById('enterForm').submit();
    } 
}); 

// document.getElementById('enterRoomBtn').addEventListener('click', function () {

//         const enteredNameCond = enteredName.value.replace(/\s/g, '').length===0;
//         const timeLimitCond = timeLimit.value.replace(/\s/g, '').length===0;
//         const selectRoundCond = selectRound.value.replace(/\s/g, '').length===0;

//         if(enteredNameCond || timeLimitCond || selectRoundCond) {
//             roomErr.innerText = "Enter All Required Fields.";
//             roomErr.style.display = "block";
//         } else {
//             if(customWords.value.length>=30)
//             {
//             roomErr.innerText = "Please Enter Custom Words in 30 characters.";
//             roomErr.style.display = "block";
//             }
//             else {
//             document.getElementById('pvtRoomForm').submit();
//             } 
//         }
// }); 

// document.getElementById('enterPvtRoom').addEventListener('click', function() {
//     document.getElementById('pvtRoomPopUp').style.display = 'flex';
// });

// document.getElementsByClassName('close')[0].addEventListener('click', function() {
//     document.getElementById('pvtRoomPopUp').style.display = 'none';
//     roomErr.style.display = "none";
// });

// document.getElementsByClassName('clear')[0].addEventListener('click', function() {
//     clearRoomForm();
// });

// customCheck.addEventListener('click', function() {
//     customWords.disabled = !this.checked;

//     if(!this.checked) {
//     customWords.value = '';
//     }
// });

// pvtRoomUrl.addEventListener('mouseover', function() {
//     const URL = 'Game URL'; 
//     this.innerHTML=URL;
// });

// pvtRoomUrl.addEventListener('mouseout', function() {
//     const HiddenURL = 'Hover here for the URL and Invite Your Friends.'; 
//     this.innerText=HiddenURL;
// });
