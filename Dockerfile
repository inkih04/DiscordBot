# Imagen oficial de Node.js (ligera)
FROM node:22-slim

# Carpeta de trabajo
WORKDIR /app

# Copia los archivos de tu bot
COPY package*.json ./

# Instala dependencias
RUN npm install --production

# Copia el resto del código
COPY . .

# Comando para iniciar el bot
CMD ["node", "index.js"]
