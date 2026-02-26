FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括 devDependencies）
RUN npm install

# 复制所有文件
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建
RUN npm run build

# 运行阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 创建数据目录
RUN mkdir -p /tmp

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/tmp/bullet-journal.db"

CMD ["node", "server.js"]
