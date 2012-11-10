var amqp = require('amqp');
var is_creeper = process.env.npm_package_config_creeper || 1;
var server = (is_creeper == 1) ? require('creeper.js') : require('chicken.js');

function date() {
  var _date = new Date();
  return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear() + " " + _date.getHours() + ":" + _date.getMinutes();
}

function trim (str) {
	str = str.replace(/^\s+/, '');
	for (var i = str.length - 1; i >= 0; i--) {
		if (/\S/.test(str.charAt(i))) {
			str = str.substring(0, i + 1);
			break;
		}
	}
	return str;
}

var connection = amqp.createConnection({ 
    host: process.env.npm_package_config_amqp_host,
    login : process.env.npm_package_config_amqp_user,
    password: process.env.npm_package_config_amqp_pass,
    vhost: process.env.npm_package_config_amqp_vhost
});
// Wait for connection to become established.
connection.on('ready', function () {
  connection.queue(process.env.npm_package_config_amqp_cons_queue, 
    {durable: true, autoDelete: false},
    function(q){
        console.log('queue '+process.env.npm_package_config_amqp_cons_queue+' connected');
      // Catch all messages
      q.bind('#');

      // Receive messages
      q.subscribe(function (message) {
          console.log(JSON.parse(message.data));
        // Print messages to stdout
        handle(connection,JSON.parse(message.data));
      });
      q.on('error', function(err) { console.log(err); });
  });
  
  connection.queue(process.env.npm_package_config_amqp_prod_queue, 
    {durable: true, autoDelete: false},
    function(q){
        console.log('queue '+process.env.npm_package_config_amqp_prod_queue+' connected');
        q.on('error', function(err) { console.log(err); });
  });
});
connection.on('error',function(err) {
    console.log(err);
});

var handle = function(c, message) {
    console.log('['+ date() + '] Command received : '+ message.command);
    switch(message.command) {
      case 'create':
        server.create(message,c);
        break;
      case 'delete':
        server.delete_image(message,c);
        break;
      case 'start':
        server.start(message,c);
        break;
      case 'stop':
        server.stop(message,c);
        break;
      case 'password':
        server.password(message,c);
        break;
      default:
        console.log('['+date()+'] stderr : Unknown command ' + message.command); 
        break;
    }
};

function error(cmd)
{
  cmd.stderr.on('data',function (data) {
    console.log('['+date()+'] stderr : '+data);
  });
}