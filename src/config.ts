import type { MigrationConfig } from "drizzle-orm/migrator";
process.loadEnvFile();
type APIConfig = {
  fileserverHits: number;
  platform:string;
  secret:string;
  polka_key:string
};
type DBConfig = {
  migrationConfig:MigrationConfig,
  dbURL:string
}

type Config = {
  api:APIConfig;
  db:DBConfig;

}
const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/generated_files",
}
export const config:Config = {api:{fileserverHits:0,platform:process.env.PLATFORM as string,secret:process.env.SECRET as string,polka_key:process.env.POLKA_KEY as string },db:{migrationConfig,dbURL:process.env.DB_URL as string}};




