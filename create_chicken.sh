#!/bin/bash

# Add User
MC_USER=$1

useradd -g minecraft -s /bin/bash -m ${MC_USER}
chmod -R go-rwx /home/${MC_USER}
wget http://dl.hostyourcreeper.com/craftbukkit/craftbukkit.jar \
  -O /home/${MC_USER}/minecraft/craftbukkit.jar
chown ${MC_USER}:minecraft /home/${MC_USER}/minecraft/craftbukkit.jar