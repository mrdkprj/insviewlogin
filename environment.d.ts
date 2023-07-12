declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: "development" | "production";
            PORT?: string;
            TOKEN: string;
            USER_ID: string;
            COUNT: string;
            VERSION: string;
            QUERY_HASH: string;
            SECRET: string;
            AZ_ENDPOINT: string;
            AZ_KEY:string;
            AZ_DB_ID:string;
            ACCOUNT:string;
        }
    }
  }

  // If this file has no import/export statements (i.e. is a script)
  // convert it into a module by adding an empty export statement.
  export {}