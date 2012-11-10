var spawn = require('child_process').spawn,
    fs = require('fs');

exports.create = function(message,c)
{
    var retour;
    var cmd = spawn(__dirname + '/create_chicken.sh', [message.vm_number]);
    cmd.stdout.on('data',function (data) {
        retour += data.toString();
    });
    cmd.on('exit', function() {
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
            cmd = spawn('echo',['\"srv'+data.vm_number+':'+passwd+'\" | chpasswd']);
            cmd.on('exit',function (code) {
                if(code == 0)
                    c.publish(process.env.npm_package_config_amqp_prod_queue, 
                        JSON.stringify({ command: 'password', id: message.id, passwd : passwd })); 
            });
            error(cmd);
        });
    }
};
