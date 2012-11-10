#!/bin/bash

usage()
{
    echo "Usage: $0 -n vm_number -m memory_size -b backup -d disk_space_added -s ssd"
    exit
}

while getopts n:m:b:d:s: option
do
 case $option in
  n)
   NUMBER=$OPTARG 
   ;;
  m)
   MEMORY=$OPTARG
   ;;
  b)
    BACKUP=$OPTARG
   ;;
  d)
    DISK=$OPTARG
   ;;
  s)
    SSD=$OPTARG
   ;;
  *) usage
   ;; 
  esac
done

if [[ -z $MEMORY ]]
then
    MEMORY=1024
fi

if [[ -z $SSH ]]
then
    SSH=0
fi
if [[ -z $BACKUP ]]
then
    BACKUP=0
fi
if [[ -z $DISK ]]
then
    DISK=0
fi
if [[ -z $SSD ]]
then
    SSD=0
fi
DISK=${DISK}Gb


PASSWORD=$(pwgen -s 12 1)
DB_PASSWORD=$(pwgen -s 12 1)
MURMUR_PASSWORD=$(pwgen -s 12 1)
HOST="vm${NUMBER}"
# Reglage de la gateway
DOMU_IP="10.10.10.${NUMBER}"
GATEWAY=$(echo $DOMU_IP | awk -F. '{print $1"."$2"."$3"."$4 + 127}')

VM_MEMORY=${MEMORY}M

RETOUR=$(xen-create-image \
--install-method=tar \
--install-source=/etc/xen-tools/base.tar \
--hostname=$HOST \
--ip=$DOMU_IP \
--arch=amd64 \
--dist=squeeze \
--gateway=$GATEWAY \
--role=minecraft-hook \
--role-args="$(mkpasswd ${PASSWORD}) $MEMORY $DOMU_IP $BACKUP $DB_PASSWORD $MURMUR_PASSWORD $SSD" \
--size=$DISK \
--memory=$VM_MEMORY)

ROOT_PASS=$(echo $RETOUR | egrep -o 'Root Password.*' | awk '{print $4}')
echo "${ROOT_PASS}"

FILE=/etc/xen/${HOST}.cfg

if [[ $SSD -gt 0 ]]
then
    LVCREATE=$(lvcreate -L ${SSD}G -n ${HOST}-ssd vg_ssd)
    mkfs.ext3 /dev/vg_ssd/${HOST}-ssd
    $(sed -i "19a 'phy:/dev/vg_ssd/${HOST}-ssd,xvda3,w'," ${FILE})
fi

RETOUR2=$(xm create ${FILE})

echo "${PASSWORD}"
echo "${DB_PASSWORD}"
echo "${MURMUR_PASSWORD}"

echo "$LVCREATE"

touch /opt/firewall/vm/${NUMBER}

FW=$(/opt/firewall/firewall.sh restart)
