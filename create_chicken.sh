#!/bin/bash

# Add User
MC_USER=srv$1
PORT=$((25500+$1))

useradd -g minecraft -s /bin/bash -m ${MC_USER}
chmod -R go-rwx /home/${MC_USER}
wget http://dl.hostyourcreeper.com/craftbukkit/craftbukkit.jar \
  -O /home/${MC_USER}/minecraft/craftbukkit.jar >/dev/null 2>&1
chown ${MC_USER}:minecraft /home/${MC_USER}/minecraft/craftbukkit.jar
sed -i "s/PORT=25565/PORT=$PORT/" /home/${MC_USER}/minecraft.sh
echo "Server installed"