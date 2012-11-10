var spawn = require('child_process').spawn,
    fs = require('fs');

exports.create = function(message,c)
{
    var retour;
    var cmd = spawn(__dirname + '/create_image.sh',
            ['-n',message.vm_number, '-m', message.memory, '-b', message.options.backup, '-d', message.options.disk ]);
    cmd.stdout.on('data',function (data) {
        retour += data.toString();
    });
    cmd.on('exit', function() {
        var passwd = retour.split("\n");
        c.publish(process.env.npm_package_config_amqp_prod_queue, JSON.stringify({ command: 'create', id: message.id, root: passwd[0], mc: passwd[1], db: passwd[2], murmur: passwd[3] })); 
    });
    error(cmd);
};

exports.start = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var cmd = spawn('xm',['create', "vm"+data.vm_number+".cfg" ]);
        error(cmd);
    }
};

exports.stop = function(data,c)
{
    if(!data.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        var cmd = spawn('xm',['destroy', "vm"+data.vm_number]);
        error(cmd);
    }
};

exports.delete_image = function(data,c)
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
            cmd = spawn('ssh',['root@10.10.10.'+message.vm_number,'echo \"minecraft:'+passwd+'\" | chpasswd']);
            cmd.on('exit',function (code) {
                if(code == 0)
                    c.publish(process.env.npm_package_config_amqp_prod_queue, JSON.stringify({ command: 'password', id: message.id, passwd : passwd })); 
            });
            error(cmd);
        });
    }
};
