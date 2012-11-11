var spawn = require('child_process').spawn,
    exec = require('child_process').exec
    fs = require('fs');

exports.create = function(message,c)
{
    var retour = "";
    var cmd = spawn(__dirname + '/create_chicken.sh', [message.vm_number]);
    cmd.stdout.on('data',function (data) {
        retour += data.toString();
    });
    cmd.on('exit', function() {
        console.log(retour);
        c.publish(process.env.npm_package_config_amqp_prod_queue, 
            JSON.stringify({ command: 'create', 
                id: message.id}));
        exports.password(message,c);
    });
    error(cmd);
};

exports.start = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else {
        exec('su srv'+data.vm_number+' -c "/home/srv'+data.vm_number+'/minecraft.sh start"',function(err,result){
            if(err) console.log(err);
        });
    }
};

exports.stop = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else {
        exec('su srv'+data.vm_number+' -c "/home/srv'+data.vm_number+'/minecraft.sh stop"',function(err,result){
            if(err) console.log(err);
        });
    }
};

exports.delete_image = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var stop = exec('su srv'+data.vm_number+' -c "/home/srv'+data.vm_number+'/minecraft.sh stop"',function(err,result){
            if(err) console.log(err);
        });
        stop.on('exit', function(){
            var cmd = spawn('userdel',['-f', '-r', 'srv'+data.vm_number ]);
            error(cmd);
            cmd.on('exit', function() {
                console.log('User srv'+data.vm_number+' deleted.');
            });
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
            exec('echo "srv'+message.vm_number+':'+passwd+'" | chpasswd', function(err,result) {
                if(err) console.log(err);
                else
                    c.publish(process.env.npm_package_config_amqp_prod_queue, 
                        JSON.stringify({ command: 'password', id: message.id, passwd : passwd })); 
            });
        });
    }
};


exports.dedicated_ip = function(message,c) {

}

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