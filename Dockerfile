# Usa la imagen oficial de OpenJDK 17
FROM openjdk:17-jdk-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instala dependencias para Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs git && \
    rm -rf /var/lib/apt/lists/*

# Copia Lavalink y el bot al contenedor
COPY . .

# Instala dependencias del bot
RUN npm install

# Expone el puerto de Lavalink y el del bot (Render usará el que pongas en el servicio)
EXPOSE 2333
EXPOSE 10000

# Variable de entorno para la contraseña de Lavalink
ENV LAVALINK_PASSWORD=changeme

# Comando para iniciar Lavalink, esperar 5 segundos, y luego iniciar el bot
CMD java -Djdk.tls.client.protocols=TLSv1.2 \
         -DLAVALINK_PASSWORD=$LAVALINK_PASSWORD \
         -jar Lavalink.jar & \
    echo "⏳ Esperando 5 segundos para que Lavalink arranque..." && \
    sleep 5 && \
    node index.js
