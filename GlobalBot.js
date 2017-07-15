/**
 * Created by jaxsen on 7/11/2017 @ 4:58 AM.
 */

function GlobalBot(){
    // Create commands to accept
    this.cmd = {
        "purge": {
            "src": "discord",
            "attr": [0,-1],
            "correct": ""
        },
        "ping": {
            "src": "twitchdiscord",
            "attr": [0,-1],
            "correct": ""
        },
        "yorn": {
            "src": "twitchdiscord",
            "attr": [0,-1],
            "correct": ""
        },
        "check": {
            "src": "discord",
            "attr": [0,-1],
            "correct": ""
        },
        "addchannel": {
            "src": "discord",
            "attr": [1,2],
            "correct": "!addchannel [channel] (@ everyone? (y/N))"
        }
    }

    // alternatives to y/n
    this.y = ["yes","ye","y","1","true"];
    this.n = ["no","n","0","nope","false"];
}

// add discord to globalbot object
GlobalBot.prototype.addDiscord = function (d){
    this.discord = d;
};
// add twitch to globalbot object
GlobalBot.prototype.addTwitch = function(t){
    this.twitch = t;
};

// command received; check if valid
GlobalBot.prototype.cmdRec = function(msg,src,discord,twitch){
    // make sure src is valid & discord or twitch is filled out
    if(src !== "twitch" && src !== "discord"){return false;}
    if(discord.length === 0 && twitch.length === 0){return false;}

    // split up command a bit to be more readable in program
    let subbed = msg.substring(1);
    let com = subbed.split(" ");

    // check if it is a command for the source
    if(this.checkIfCMD(com[0],src)){
        // make sure it has a valid number of attributes
        if(!this.checkAttr(com)){
            this.gSay(src,`Correct usage: ${this.cmd[com[0]]["correct"]}`,[discord,twitch]);
            return false;
        }

        // send it
        this.doCMD(com[0],src,[discord,twitch]);
    }
};

// check if command exists in cmd & fits source
GlobalBot.prototype.checkIfCMD = function(subbed,src){
    try{return this.cmd[subbed]["src"].includes(src);}
    catch(e){return false;}
};

// check if command attributes are correct
GlobalBot.prototype.checkAttr = function (com){
    const min = this.cmd[com[0]]["attr"][0];
    const max = this.cmd[com[0]]["attr"][1];
    const thisAttr = com.length - 1;

    // check min
    if(thisAttr < min)return false;

    // check max
    return !(thisAttr > max && max !== -1);
};

// send message to either twitch or discord depending on src
GlobalBot.prototype.gSay = function(src,msg,reqs){
    if(src === "twitch"){
        this.twitch.msg(reqs[1][0],msg);
    } else if (src === "discord"){
        this.discord.msg(reqs[0][0],msg);
    }
};

// get @ via source & requirements to get @
GlobalBot.prototype.at = function(src,req){
   if(src === "discord"){
       return this.discord.at(req[0][0]);
   }
   else if (src === "twitch"){
       return this.twitch.at(req[1][1]);
   }
};

// get message
GlobalBot.prototype.getMessage = function(src,req){
    if(src === "discord"){
        return req[0][0].content;
    }
    else if(src === "twitch"){
        return req[1][2];
    }
};

GlobalBot.prototype.doCMD = function(com,src,reqs){
    this[com](src,reqs);
};

// check if it's a yes/or no
GlobalBot.prototype.ynMatch = function(msg){
    if(this.y.includes(msg)){ return "y"; }
    if(this.n.includes(msg)){ return "n"; }
    return "";
};


//// ---[ COMMANDS ]--- ////
// to make a new command:
// ```
// GlobalBot.prototype.[name] = function(src,reqs){
//     // your code
// }
// ```
// src = where the command came from ("twitch" or "discord")
// reqs = what each message event sends (discord is discord.js message object & twitch is all the vars)
//        reqs[0] is where discord variables are
//        reqs[1] is where twitch variables are

// __DISCORD AND TWITCH__ //
// yorn - sends yes or no
GlobalBot.prototype.yorn = function(src,reqs){
    if(Math.random() >= 0.5){
        this.gSay(src,`${this.at(src,reqs)}, yes.`,reqs);
    }else{
        this.gSay(src,`${this.at(src,reqs)}, no.`,reqs);
    }
};
// ping - responds with '@<user>, pong!'
GlobalBot.prototype.ping = function(src,reqs){
    this.gSay(src,`${this.at(src,reqs)}, pong!`,reqs);
};

//      __DISCORD__      //
// add channel
GlobalBot.prototype.addchannel = function(src,reqs){
    // get attributes
    const attr = this.getMessage(src,reqs).split(" ");

    this.gSay(src,`Turning on notifications for ${attr[1]}...`,reqs);

    // make sure it is a channel
    this.twitch.isChannel(attr[1])
        .then(response => {
            if(response){
                // check if is in this.twitch.channelsPing
                let already_made = this.twitch.channelsPing[attr[1]];

                // not yet in channelsPing! add it to the list
                if(!already_made){
                    console.log(`Adding ${attr[1]} to channelsPing`);
                    this.twitch.channelsPing[attr[1]] = {
                        "recs":[],
                        "lastsent":false,
                        "starttime":null
                    }
                }

                // check if channel is already in
                for(let x = 0; x < this.twitch.channelsPing[attr[1]]["recs"].length; x++){
                    if(this.twitch.channelsPing[attr[1]]["recs"][x][0].id === reqs[0][0].channel.id){
                        this.gSay(src,`This channel already has notifications for ${attr[1]}!`,reqs);
                        return;
                    }
                }

                // add this discord channel to list
                this.twitch.channelsPing[attr[1]]["recs"].push([reqs[0][0].channel,this.ynMatch(attr[2]) === "y"]);

                this.gSay(src,`Notifications turned on for ${attr[1]}!`,reqs);
            } else {
                this.gSay(src,`${attr[1]} isn't a channel!`,reqs);
            }
        })
        .catch(error => {
            this.gSay(src,"Error! Try again!",reqs);
            console.log(error);
        });
};
// purge chat - deletes all messages in channel
GlobalBot.prototype.purge = function(src,reqs){
    const message = reqs[0][0];
    if(message.guild !== null) {
        const param = message.content.split(" ");
        if (this.discord.checkPerms(message, "MANAGE_MESSAGES")) {
            if (param[1] < 1) {
                return;
            } // make sure param[1] is valid

            message.channel.fetchMessages({limit: param[1]})
                .then(messages => {
                    messages.deleteAll();
                })
                .catch(console.error);
        }
    } else {
        // guild isn't available
        this.gSay(src,"Sorry! This command doesn't work in DMs.",reqs);
    }
};

module.exports = GlobalBot;