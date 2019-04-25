const auth = require("solid-auth-client");
const Core = require("../lib/core");
const DataSync = require("../lib/datasync");
const Alerts = require("./alerts");
const NotificationManager = require("../lib/notificationmanager");
//const fc = require("solid-file-client");

const Personal = require("../lib/personal");

let refreshIntervalId;
let core = new Core(auth.fetch);
let personal = null;
let dataSync= new DataSync(auth.fetch);
let nm = new NotificationManager();
let alerts = new Alerts();

let recorder = null;
let audio = null;

/**
 *    UTILITY FUNCTIONS
 */

function afterChatOption(){
  $("#chat-options").addClass("hidden");
  $("#how-it-works").addClass("hidden");
}

function loading1(){
  $("#chat-options").addClass("hidden");
  $("#how-it-works").addClass("hidden");
  $("#loading-gif").removeClass("hidden"); 
}

function loading2(){
  $("#loading-gif").addClass("hidden"); 
  $("#chat-options").removeClass("hidden");
  $("#how-it-works").removeClass("hidden");
}


function moveScrollDown(){
  $("#addMessages").animate({ scrollTop: document.getElementById("addMessages").scrollHeight }, 1000);
  $("#addMessagesGroup").animate({ scrollTop: document.getElementById("addMessages").scrollHeight }, 1000);
}

function showMain(){
  $("#chat").addClass("hidden");
  $("#toHide").addClass("hidden");
  $("#join-chat-options").addClass("hidden");
  $("#continue-chat-options").addClass("hidden");
  $("#chat-options").removeClass("hidden");
  $("#how-it-works").removeClass("hidden");
}

function optionEnabled(option){
  $("#"+option+"-enabled").removeClass("hidden");
  $("#"+option+"-disabled").addClass("hidden");
}

function optionDisabled(option){
  $("#"+option+"-enabled").addClass("hidden");
  $("#"+option+"-disabled").removeClass("hidden");
}


/**
 *    CALLING FUNCTIONS
 */

async function loadMessagesFromChat() {
  var texto = $("#urlContact").text();
  if(texto !== "Select a contact to start chatting"){
    core.loadMessages(personal, texto, nm, false).then(() => {
      core.checkForNotifications(personal, nm);
    });
  }   
  else{
    core.checkForNotifications(personal, nm);
  }
}

async function changeStateOfEmojis(){
  var a = $("#emojis-enabled").attr("class");
  if(a.includes("hidden")){
    core.changeStateOfEmojis(true);  
    optionEnabled("emojis");
  }
  else {
    core.changeStateOfEmojis(false);
    optionDisabled("emojis");
  }
  await loadMessagesFromChat();
}

async function changeStateOfNotifications(){
  var a = $("#notifications-enabled").attr("class");
  if(a.includes("hidden")){
    $("#notification-box").removeClass("hidden");
    optionEnabled("notifications");
  }
  else {
    $("#notification-box").addClass("hidden");
    optionDisabled("notifications");
  }
}

function sendMessage(){
  var message = $("#data-name").val();
  var receiver = $("#urlContact").text();
  if (receiver.length !== 0){
	  $("#data-name").val("");
	  core.sendMessage(personal, receiver, message);
	  $("#emoji-panel").prop("hidden",true);
	  setTimeout(function(){ moveScrollDown(); }, 5000);
  }
  else
	  alert("Select a contact to send a message, please");
}

async function loadChat(name, urlgroup){	
	$("#drop_zone").removeClass("hidden");
	$("#contactName").text(name);
	if ( urlgroup !== null ) {
		core.loadMessages(personal, urlgroup, nm, false);
		$("#urlContact").text(urlgroup);
	} else {		
		core.loadMessages(personal, name, nm, false);
		$("#urlContact").text(name);
	}
	setTimeout(function(){ moveScrollDown(); }, 2000);
}


/**
 * START
 */

auth.trackSession(async (session) => {
  const loggedIn = !!session;

  if (loggedIn) {
    personal = new Personal(core);
    nm = new NotificationManager();
    loading1();

    personal.loadNames(session.webId).then((name) => {
      personal.loadInbox();
      $("#user-name").text(name);
      $("#nav-login-btn").addClass("hidden");
    });

    personal.loadFriendList().then(() => { 
      setTimeout(function(){
        loading2();
        $("#user-menu").removeClass("hidden");
        $("#login-required").modal("hide");  
      }, 1000);
    });

    await core.checkForNotifications(personal, nm);
    // refresh every 5 sec
    refreshIntervalId = setInterval(loadMessagesFromChat, 5000);
  } 
  else {
    $("#nav-login-btn").removeClass("hidden");
    $("#user-menu").addClass("hidden");
    showMain();
    
    if(personal !== null){
      personal.clearInfo();
    }  
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
});

/**
 * BUTTONS CLICK
 */



$(".login-btn").click(() => {
  auth.popupLogin({ popupUri: "https://solid.github.io/solid-auth-client/dist/popup.html" });
});

$("#logout-btn").click(() => {
  auth.logout();
});


$("#refresh-btn").click(loadMessagesFromChat);

$("#test-btn").click(() => {
  if(personal !== null){
    personal.reloadFriendList();
  }
});

$("#add-friend-menu").click(() => {
  if (personal !== null) {
    afterChatOption();
    $("#manage-friends").modal("show");
  } else {
    $("#login-required").modal("show");
  }
});

$("#add-friend-button").click(() => {
  var friendMe = $("#friend-name").val();
  core.addFriend(personal, friendMe);
  $("#friend-name").val("");
  setTimeout(function(){;setTimeout(function(){;}, 500);}, 50);
});

/**
 * This method updates the UI after a chat option has been selected by the user.
 */


$("#new-btn").click(async () => { 
  if (personal !== null) {
    afterChatOption();
    //$("#possible-people").empty();
	$("#peopleToChat").empty();
    var i=0;
    core.getChatGroups(personal).then((groupNames) => {
      for(const chat of groupNames) {
        //$("#possible-people").append("<option value="+chat.file.url+">"+chat.name+"</option>");  
		$("#peopleToChat").append("<div id='clicable"+i+"' class='chat_list'>" +
              "<div class='chat_people'>" +
                "<div class='chat_img'> <img src='https://ptetutorials.com/images/user-profile.png' alt='sunil'> </div>" +
                "<div class='chat_ib'>" +
                  "<h5>"+chat.name+/*"<span class='chat_date'>Dec 25</span>*/"</h5>" +
                  /*"<p>Test, which is a new approach to have all solutions" +
                   " astrology under one roof.</p>" +*/
                "</div>" +
              "</div>" +
            "</div>");
		document.getElementById("clicable" + i).addEventListener("click", function(){loadChat(chat.name,chat.file.url)}, false);
		i++;
      }
    });
    for await (const friend of personal.friendList) {		
       // $("#possible-people").append("<option value="+friend.username+">"+friend.username+"</option>");
		$("#peopleToChat").append("<div id='clicable"+i+"' class='chat_list'>" +
              "<div class='chat_people'>" +
                "<div class='chat_img'> <img src='https://ptetutorials.com/images/user-profile.png' alt='sunil'> </div>" +
                "<div class='chat_ib'>" +
                  "<h5>"+friend.username+/*"<span class='chat_date'>Dec 25</span>*/"</h5>" +
                  /*"<p>Test, which is a new approach to have all solutions" +
                   " astrology under one roof.</p>" +*/
                "</div>" +
              "</div>" +
            "</div>");
		document.getElementById("clicable" + i).addEventListener("click", function(){loadChat(friend.username,null)}, false);
		i++;
    }
    $( "#possible-people" ).dropdown();
    
    $("#data-name").keydown(function (e) {
      if (e.keyCode === 13) {
        sendMessage();
      }
    });
    $("#toHide").removeClass("hidden");
	$("#drop_zone").addClass("hidden");
    $("#emoji-panel").removeClass("hidden");
  } else {
    $("#login-required").modal("show");
  }
});

$("#create-group").click(async () => { 
  if (personal !== null) {
    afterChatOption();
    $("#check-people-group").empty();
    for await (const friend of personal.friendList) {
      $("#check-people-group").append("<input class=\"form-check-input\" type=\"checkbox\" id=\""+friend.username+
                                      "\"><label class=\"form-check-label\" for=\""+friend.username+"\">"+
                                      friend.username+"</label><br>");
    }
    $("#create-new-group").modal("show");
  } else {
    $("#login-required").modal("show");
  }
});

$("#create-button").click(async () => { 
  var friendsGroup = new Array();
  for await (const friend of personal.friendList) {
    if($("#"+friend.username).prop("checked")){
      friendsGroup.push(friend);
    }
  }
  //$("#create-new-group").addClass("hidden");
  // CREAR EL GRUPO AQUI
  var nameGroup = $("#group-name").val();
  if(friendsGroup.length > 0){
    if(nameGroup.length > 0 && nameGroup.trim().length > 0){
		core.createGroup(personal, friendsGroup);
		// personal.loadFriendList().then(() => { 
		// setTimeout(function(){
		// }, 1000);
		// $("#new-btn").click();
    //});
    }
    else{
      alerts.errorGroupCreated("Error creating new group", "Wrong name");
    }
  }
  else{
    alerts.errorGroupCreated("Error creating new group", "No friends selected");
  }
  $("#group-name").val("");
});




$("#start-new-chat-btn").click(async () => {
	sendMessage();
});




$("#clear-inbox-btn").click(async () => {
  $("#all-inbox-to-remove").empty();
  for (var file of personal.myInbox) {
    if(file.url.includes("group_")){
      var group = personal.getGroupByMyUrl(file.url);
      $("#all-inbox-to-remove").append(
            "<input class=\"form-check-input\" type=\"checkbox\" id=\""+file.label+"\">"
              + "<label class=\"form-check-label\" for=\""+file.label+"\">"
                + file.label + "  (Group: "+group.name+")</label><br>");
    }
    else{
      $("#all-inbox-to-remove").append(
        "<input class=\"form-check-input\" type=\"checkbox\" id=\""+file.label+"\">"
          +"<label class=\"form-check-label\" for=\""+file.label+"\">"+file.label+"</label><br>");
    }
    
  }
  $("#inbox-files").modal("show");
});

$("#select-all").click(async () => {
  $(":checkbox").prop("checked", true);
});

$("#remove-selected-files").click(async () => {
  var urls = new Array();
  for (var file of personal.myInbox) {
    if($("input[id=\""+file.label+"\"]").prop("checked")){
      urls.push(file.label);
    }
  }
  personal.clearInbox(dataSync, urls).then((i) => {
    alerts.alertCountRemovedFromInbox(i);
    personal.loadInbox();
  });
});



$("#goBack").click(() => {
	showMain();
});


$(".emoji-button").click(function() { 
	var id = $(this).attr("id");
	if($("#data-name").val().length === 0) {
		$("#data-name").val(":"+id+": ");
	} else {
		$("#data-name").val($("#data-name").val() + " :"+id+": ");
	}
});

// Hide and show emoji panel
$("#openEmojiBtn").click(() => {
	var isActivated = ! ($("#emoji-panel").attr("hidden"));
	$("#emoji-panel").prop("hidden",isActivated);
	isActivated = !($("#addMessagesGroup").attr("hidden"));
	$("#addMessagesGroup").prop("hidden",isActivated);
});

$("#sendFiles").click(() => {
	console.log("Hola");
});

$("#share-friend-button").click(() => {
	var friendMe = $("#share-name").val();
	var platform = $(".input:radio[name=preg1]:checked").val();
	console.log(platform);
	  // core.addFriend(personal, friendMe);
	  // $("#friend-name").val("");
	  // setTimeout(function(){;setTimeout(function(){;}, 500);}, 50);
});

$("#sendContact").click(() => {
	$("#share-friend").modal("show");
});

$("#sendUbication").click(() => {
	
	navigator.geolocation.getCurrentPosition(getPosicion.bind(this), verErrores.bind(this));
	
	function getPosicion(posicion){
        var longitud = posicion.coords.longitude; 
        var latitud = posicion.coords.latitude;   
		    $("#data-name").val(latitud + "," + longitud);
    }
    function verErrores(error){
		var mensaje = "";
        switch(error.code) {
        case error.PERMISSION_DENIED:
            mensaje = "El usuario no permite la petición de geolocalización"
            break;
        case error.POSITION_UNAVAILABLE:
            mensaje = "Información de geolocalización no disponible"
            break;
        case error.TIMEOUT:
            mensaje = "La petición de geolocalización ha caducado"
            break;
        case error.UNKNOWN_ERROR:
            mensaje = "Se ha producido un error desconocido"
            break;
        }
		if ( mensaje !== "" )
			console.log(mensaje);

    }
});

$("#enable-emojis").click(() => {
	changeStateOfEmojis();
});

$("#enable-notifications").click(() => {
	changeStateOfNotifications();
});


//Images sharing (here for some time)

function dropped(e){
	e.preventDefault();
	var files = e.dataTransfer.files;
	var receiver = $("#contactName").text();
	for ( var f=0; f<files.length; f++){
		if ( files[f].name.endsWith(".png") || files[f].name.endsWith(".jpg") ) {
			console.log("Storing photo");
			console.log(files[f].name);
			var reader = new FileReader();
			reader.onload = async function (event){
				$("#data-name").val(event.target.result);
			};
			reader.readAsDataURL(files[f]);
			core.storePhoto(personal,receiver);
		}
	}
}

function start(){
	var drop = document.getElementById("drop_zone");
	
	drop.addEventListener("dragenter",function(e){
		e.preventDefault();
	}, false);
	
	drop.addEventListener("dragover", function(e){
		e.preventDefault();
	}, false);
	
	drop.addEventListener("drop", dropped, false);
}

// $("#sendContact").click(() => {
	// recordStop();
// });

window.addEventListener("load", start, false);
