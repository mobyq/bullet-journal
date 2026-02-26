FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/tmp/bullet-journal.db"

CMD ["npm", "start"]
