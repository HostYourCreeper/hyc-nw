# HostYourCreeper Node Worker

## Installation

npm install
npm start

## Configuration

npm config set hyc-nw:amqp_host "localhost"
npm config set hyc-nw:amqp_user "myuser"
npm config set hyc-nw:amqp_pass "mypass"
npm config set hyc-nw:amqp_vhost "/myapp"
npm config set hyc-nw:amqp_cons_queue "myapp-cons"
npm config set hyc-nw:amqp_prod_queue "myapp-cons"
npm config set hyc-nw:creeper 1

## Format des messages

### Installation

message {
  command : 'create',
  id : $commande_id,
  vm_number : 11,
  memory : '1024',
  options : {
    backup : 0,
    disk : 0,
    ip: '',
  }
}

retour { 
  command: 'create',
  id: message.id,
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
  id : $commande_id,
  vm_number : 11
}

retour {
  command : 'password',
  id: message.id,
  passwd : passwd
}

### Dedicated IP

message {
  command : 'dedicated_ip',
  vm_number : 11,
  ip: '127.0.0.1',
}

message {
  command : 'dedicated_ip',
  vm_number : 11,
  ip: '',
}