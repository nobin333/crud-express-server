
import dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.join(process.cwd(), ".env") });
// console.log(process.cwd())
const config ={
    connectionStr: process.env.CONNECTION_STRING,
    port: 5000
}
export default config