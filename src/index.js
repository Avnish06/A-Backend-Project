// require('dotenv').config({path: './env' }) Ite is destroing our consistency thatswhy.
import { app } from "./app.js"
import dotenv from "dotenv"
import ConnectDB from "./db/index.js"


dotenv.config({
    path: './.env'
})
 

ConnectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on the port: ${process.env.PORT}`);
      
      app.on("error", (error) => {
        console.log("Your error is here", error);
      });
    });
  })
  .catch((err) => {
    console.log("Mongodb connection failed !!!", err);
  });

















































































































































































// const app = express()
// (async () => {
// try {
//    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error",(error)=> {

//           console.log("Err", error)
//           throw error

//        })

//        app.listen(process.env.PORT, ()=> {
       
//            console.log(`App is listening on the port ${process.env.PORT}`)

//           })
     
// } catch (error) {
//     console.error("ERROR ", error)
// }

// })()