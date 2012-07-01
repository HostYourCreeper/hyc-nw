var spawn = require('child_process').spawn,
    fs = require('fs'),
    amqp = require('amqp');

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
        create(message,c);
        break;
      case 'delete':
        delete_image(message,c);
        break;
      case 'start':
        start(message,c);
        break;
      case 'stop':
        stop(message,c);
        break;
      case 'password':
        password(message,c);
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

var create = function(message,c)
{
    var retour;
    var cmd = spawn(__dirname + '/create_image.sh',
            ['-n',message.vm_number, '-m', message.memory, '-o', message.options.ssh, '-b', message.options.backup, '-d', message.options.disk ]);
    cmd.stdout.on('data',function (data) {
        retour += data.toString();
    });
    cmd.on('exit', function() {
        var passwd = retour.split("\n");
        c.publish(process.env.npm_package_config_amqp_prod_queue, JSON.stringify({ command: 'create', vm_number: message.vm_number, root: passwd[0], mc: passwd[1], db: passwd[2], murmur: passwd[3] })); 
    });
    error(cmd);
};

var start = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var cmd = spawn('xm',['create', "vm"+data.vm_number+".cfg" ]);
        error(cmd);
    }
};
var stop = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var cmd = spawn('xm',['destroy', "vm"+data.vm_number]);
        error(cmd);
    }
};

var delete_image = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var cmd = spawn('xm',['destroy', "vm"+data.vm_number ]);
        error(cmd);
        cmd.on('exit', function() {
            cmd = spawn('xen-delete-image',["vm"+data.vm_number ]);
            error(cmd);
            cmd.on('exit', function() {
                fs.unlink("/opt/firewall/vm/"+data.vm_number, function (err) {
                  if (err) {
                    console.log('['+date()+'] Can\'t delete firewall file.');
                    }
                });
            });
        });
    }
};

var password = function(message,c)
{
    if(!message.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var passwd;
        var cmd = spawn('pwgen',['-s','12','1']);
        cmd.stdout.on('data',function (data) {
            passwd = trim(data.toString());
        });
        error(cmd);
        cmd.on('exit', function() {
            cmd = spawn('ssh',['root@10.10.10.'+message.vm_number,'echo \"minecraft:'+passwd+'\" | chpasswd']);
            cmd.on('exit',function (code) {
                if(code == 0)
                    c.publish(process.env.npm_package_config_amqp_prod_queue, JSON.stringify({ command: 'password', vm_number: message.vm_number, passwd : passwd })); 
            });
            error(cmd);
        });
    }
};
