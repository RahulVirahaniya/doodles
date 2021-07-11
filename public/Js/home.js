function play(){
  const nameLength = document.getElementById('enteredNameId').value.replace(/\s/g, '').length;
  if(nameLength===0) {
    document.getElementById('nameError').innerText="Please enter your name"
    document.getElementById('nameError').style.display = "block";
    return false;
  } else if(nameLength > 20){
    document.getElementById('nameError').innerText="Please enter your name under 20 characters"
    document.getElementById('nameError').style.display = "block";
    return false;
  } else {
    document.getElementById('enterForm').submit();
  } 
}
$("#playBtn").on('click', () =>{
  play();
}); 
function enterPress(e, input){
  if(e.key == 'Enter' || e.keyCode == 13){
    e.preventDefault();
    play();
  }
}

window.addEventListener( "pageshow", function ( event ) {
  event.preventDefault();
  let historyTraversal = event.persisted || ( typeof window.performance != "undefined" && window.performance.navigation.type === 2 );
  if ( historyTraversal ) {
    window.location.reload();
  }
});
if (sessionStorage.getItem("is_reloaded")) {
  sessionStorage.removeItem("is_reloaded");
}