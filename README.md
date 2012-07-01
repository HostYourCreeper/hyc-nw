# HostYourCreeper Node Worker

## Configuration

npm config set hyc-nw:amqp_host "localhost"
npm config set hyc-nw:amqp_user "myuser"
npm config set hyc-nw:amqp_pass "mypass"
npm config set hyc-nw:amqp_vhost "/myapp"
npm config set hyc-nw:amqp_cons_queue "myapp-cons"
npm config set hyc-nw:amqp_prod_queue "myapp-cons"

## Format des messages

### Installation

message {
  command : 'install',
  vm_number : 11,
  memory : '1024',
  options : {
    ssh : 0,
    daily_backup : 0,
    six_hours_backup : 0,
    disk : 0
  }
}

retour { 
  command: 'create',
  vm_number: message.vm_number,
  root: passwd[0],
  mc: passwd[1],
  db: passwd[2],
  murmur: passwd[3]
}

### Delete

message {
  command : 'delete',
  vm_number : 11
}

### Start

message {
  command : 'start',
  vm_number : 11
}

### Stop

message {
  command : 'stop',
  vm_number : 11
}

### Password

message {
  command : 'password',
  vm_number : 11
}

retour {
  command : 'password',
  vm_number: message.vm_number,
  passwd : passwd
}
