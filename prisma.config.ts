import path from "node:path";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: ".env",
});

type Env = {
  LIBSQL_DATABASE_URL: string;
  LIBSQL_DATABASE_TOKEN: string;
};

export default defineConfig<Env>({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),

  migrate: {
    async adapter(env) {
      return new PrismaLibSQL({
        url: env.LIBSQL_DATABASE_URL,
        authToken: env.LIBSQL_DATABASE_TOKEN,
      });
    },
  },
});
