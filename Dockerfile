# Usa la imagen oficial de OpenJDK 17 como base
FROM openjdk:17-jdk-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Instala Node.js 22 y Git (para tu bot) junto con utilidades básicas
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs git && \
    rm -rf /var/lib/apt/lists/*

# Copia todo el contenido del proyecto al contenedor
COPY . .

# Instala dependencias de tu bot
RUN npm install --omit=dev

# Expone puertos
EXPOSE 2333 3000

# Variable de entorno para la contraseña de Lavalink
# (Render la configurará desde su panel)
ENV LAVALINK_PASSWORD=changeme

# Comando para iniciar Lavalink en segundo plano y luego el bot
CMD java -Djdk.tls.client.protocols=TLSv1.2 \
         -DLAVALINK_PASSWORD=$LAVALINK_PASSWORD \
         -jar Lavalink.jar & \
    node index.js
