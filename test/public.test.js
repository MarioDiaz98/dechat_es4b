var chai = require("chai");
const auth = require("solid-auth-client");



var assert = chai.assert;
const Core = require("../lib/core");
const chat = new Core(auth.fetch);
const Personal = require("../lib/personal");
let personal = new Personal(chat);


const Group = require("../lib/commgroup");

const publicComm = new Group(auth.fetch);

describe("Private communication testing", function () {
  
  it("Random string generates string",function(){
	var rdom = publicComm.randomString(5);
	assert.equal(rdom.length,5);

  }) 
  it("Create core file and send message",async function(){
      personal.username = "dechat-es4b";
      var rand = publicComm.randomString(6);
      var groupName = "Testing group"+publicComm.randomString(3);
      var friendList = new Array();
      
      
      friendList.push({username:"enriquetest2",
                        inbox: "https://enriquetest2.solid.community/inbox/",
                        webId: "https://enriquetest2.solid.community/profile/card#me"});
       friendList.push({username:"enriquead",
                        inbox: "https://enriquead.solid.community/inbox/",
                        webId: "https://enriquead.solid.community/profile/card#me"});
      
     publicComm.createCoreFile(personal,rand,groupName,friendList);
     publicComm.sendFirstMessage(personal,friendList[0],rand,groupName);  
     var comunicacion = await publicComm.communicationEstablished(personal.username,friendList[0]);
     assert.equal(comunicacion,true);
     
  })   
        
  it("Loads messages properly",async function(){
      personal.username = "enriquead";
      var result = await publicComm.loadMessages(personal,"testurl",true);
      
      
  }) 
      
})