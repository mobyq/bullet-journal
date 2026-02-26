FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json ./
RUN npm install

# 复制代码
COPY . .

# 构建
RUN npx prisma generate
RUN npm run build

# 环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/tmp/bullet-journal.db"
ENV NODE_ENV=production

EXPOSE 3000

# 直接用 node 启动
CMD ["node", ".next/standalone/server.js"]
