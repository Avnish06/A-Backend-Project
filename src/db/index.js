import mongoose from "mongoose";

import DB_NAME
import express from "express"
import DB_NAME FROM "./constants.js"

const ConnectDB = async () => {

try {

   const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
   console.log(`\n MongoDB connected  !! DB HOST: ${connectionInstance.connection.host}`)
    
} catch (error) {
    console.log("MONGODB connection error", error)
    process.exit(1)
}
}


export default ConnectDB