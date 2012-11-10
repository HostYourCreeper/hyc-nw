var spawn = require('child_process').spawn,
    exec = require('child_process').exec
    fs = require('fs');

exports.create = function(message,c)
{
    var retour;
    var cmd = spawn(__dirname + '/create_chicken.sh', ['srv'+message.vm_number]);
    cmd.stdout.on('data',function (data) {
        retour += data.toString();
    });
    cmd.on('exit', function() {
        console.log(retour);
        c.publish(process.env.npm_package_config_amqp_prod_queue, 
            JSON.stringify({ command: 'create', 
                id: message.id,
                mc: 'azerty' })); 
    });
    error(cmd);
};

exports.start = function(data,c)
{
    // Just start MC
};

exports.stop = function(data,c)
{
    // Just stop MC
};

exports.delete_image = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var cmd = spawn('userdel',['-r', 'srv'+data.vm_number ]);
        error(cmd);
        cmd.on('exit', function() {
            // OK
        });
    }
};

exports.password = function(message,c)
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
            exec('echo "srv'+data.vm_number+':'+passwd+'" | chpasswd', function(err,result) {
                if(err) console.log(err);
                else
                    c.publish(process.env.npm_package_config_amqp_prod_queue, 
                        JSON.stringify({ command: 'password', id: message.id, passwd : passwd })); 
            });
        });
    }
};

function date() {
  var _date = new Date();
  return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear() + " " + _date.getHours() + ":" + _date.getMinutes();
}

function error(cmd)
{
  cmd.stderr.on('data',function (data) {
    console.log('['+date()+'] stderr : '+data);
  });
}