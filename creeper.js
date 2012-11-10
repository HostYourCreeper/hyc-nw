var spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    fs = require('fs'),
    path = require('path'),
    async = require('async');


exports.create = function(message,c)
{
    var retour = "";
    var cmd = spawn(__dirname + '/create_image.sh',
            ['-n',message.vm_number, '-m', message.memory, '-b', message.options.backup, '-d', message.options.disk, '-s', message.options.ssd ]);
    cmd.stdout.on('data',function (data) {
        retour += data.toString();
    });
    cmd.on('exit', function() {
        var passwd = retour.split("\n");
        c.publish(process.env.npm_package_config_amqp_prod_queue, JSON.stringify({ command: 'create', id: message.id, root: passwd[0], mc: passwd[1], db: passwd[2], murmur: passwd[3] })); 
        if(message.options.ip)
            dedicated_ip({vm_number: message.vm_number, ip: message.options.ip},c);
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
        async.series([
            function(callback){
                exec('[ $(xm list | grep vm'+data.vm_number+' | wc -l ) -eq 0 ] ||  xm destroy vm'+data.vm_number,callback);
            },
            function(callback){
                var cmd = spawn('xen-delete-image',["vm"+data.vm_number ]);
                error(cmd);
                cmd.on('exit', function(code) {
                    callback(code, 'VM image '+data.vm_number+' deleted.');
                });
            },
            function(callback){
                path.exists('/dev/vg_ssd/vm'+data.vm_number+'-ssd', function (exists) {
                  if(exists)
                    exec('lvremove -f /dev/vg_ssd/vm'+data.vm_number+'-ssd',callback);
                  else
                    callback(null,'No SSD.');
                });
            },
            function(callback){
                fs.unlink("/opt/firewall/vm/"+data.vm_number, function (err) {
                    var code = 0;
                    if(err) {
                        code = -1;
                        console.log('['+date()+'] err : '+err);
                    }
                    callback(code, 'Firewall file deleted');
                });
            },
            function(callback){
                var cmd = spawn("/opt/firewall/firewall.sh", ["restart"]);
                error(cmd);
                cmd.on('exit', function(code) {
                    callback(code, 'Firewall restarted.');
                });
            }
        ],
        // optional callback
        function(err, results){
            if(err) console.log('['+date()+'] err : '+err);
            console.log('['+date()+'] results : '+results);
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
                if(code === 0)
                    c.publish(process.env.npm_package_config_amqp_prod_queue, JSON.stringify({ command: 'password', id: message.id, passwd : passwd })); 
            });
            error(cmd);
        });
    }
};

exports.dedicated_ip = function(message,c)
{
    if(!message.vm_number)
        console.log('['+date()+'] Invalid param');
    else
    {
        fs.writeFile('/opt/firewall/vm/'+message.vm_number,message.ip, function (err) {
            if (err) console.log('['+date()+'] err : '+err);
            console.log('['+date()+'] IP '+message.ip+' set to vm #'+message.vm_number+'.');
            var cmd = spawn("/opt/firewall/firewall.sh", ["restart"]);
            error(cmd);
            cmd.on('exit', function(code) {
                console.log('['+date()+'] Firewall restarted.');
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