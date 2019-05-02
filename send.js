var Steam = require('steam');

var fs = require( 'fs' );

var crypto = require('crypto')

var async = require('async');

var message = '';

var logOnOptions = {
    account_name: '',
    password: ''
};

var authCode = ''; 

if (fs.existsSync('servers')) {
  Steam.servers = JSON.parse(fs.readFileSync('servers'));
}

var steamClient = new Steam.SteamClient();
var steamUser = new Steam.SteamUser(steamClient);
var steamFriends = new Steam.SteamFriends(steamClient);

steamClient.connect();

if (fs.existsSync('sentry')) {
  logOnOptions['sha_sentryfile'] = getSHA1( fs.readFileSync('sentry') );
} else if (authCode != '') {
  logOnOptions['auth_code'] = authCode;
}

steamClient.on('connected', function() {
  steamUser.logOn(logOnOptions);
});

steamClient.on('logOnResponse', function( logonResp ) {
	if (logonResp.eresult == Steam.EResult.OK) {
		steamFriends.setPersonaState(Steam.EPersonaState.Online);
	}
});

steamClient.on('servers', function(servers) {
  fs.writeFile('servers', JSON.stringify(servers));
});

steamFriends.on('relationships', function(relationships) {
	var sendIds = [];
	
	for (var p in steamFriends.friends ) {
		if( steamFriends.friends.hasOwnProperty(p) ) {
			sendIds.push( p );
		}
	}
	
	function processId( id , callback ){
		console.log( 'Wysyłanie wiadomości do ' + id );
			
		steamFriends.sendMessage( id , message );
		
		setTimeout( function(){
			callback();
		} , 100 );
	}
	
	async.mapSeries( sendIds , processId , function( err , result ){
		process.exit();
	});
});

steamClient.on( 'error' , function( error ){
	console.log( error );
})

steamUser.on('updateMachineAuth', function(data , callback ) {
	fs.writeFileSync('sentry', data.bytes);
    callback({ sha_file: getSHA1(data.bytes) });
});

function getSHA1(bytes) {
    var shasum = crypto.createHash('sha1');
    shasum.end(bytes);
    return shasum.read();
}